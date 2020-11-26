var express = require("express");
var router = express.Router();
var mongo = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { createNotification } = require("../helpers/notification");
const { getRequestById } = require("../helpers/requestsHelper");
const { getUsertById } = require("../helpers/usersHelper");

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

var url = "mongodb://127.0.0.1:27017/xlparser";

/* GET List item*/
router.get("/getRequest", function (req, resp, next) {
  let _id = req.query.id;
  console.log("_id", _id);
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("requests")
        .find({ _id: ObjectId(_id) })
        .toArray(function (err, res) {
          if (err) throw err;
          console.log(res);
          resp.send(res);
        });
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/getRiderRequests", function (req, resp, next) {
  let uid = req.query.uid;
  console.log("uid", uid);
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("requests")
        .find({ status: 1 })
        .toArray(function (err, res) {
          if (err) throw err;
          //console.log(res);
          let rider_request = {};
          res.forEach((request) => {
            if (request.assign_json) {
              console.log(
                "🚀 ~ file: requests.js ~ line 58 ~ res.forEach ~ request.assign_json",
                request
              );
              if (
                request.assign_json.filter(
                  (rider) => rider.status == 1 && rider.uid == uid
                ).length
              ) {
                rider_request = request;
              }

              console.log(
                "🚀 ~ file: requests.js ~ line 63 ~ res.forEach ~ rider_request",
                rider_request
              );
              if (rider_request.length) {
                rider_request = rider_request[0];
              }
            }
          });
          resp.send({ message: "Success", status: 1, request: rider_request });
        });
    });
  } catch (err) {
    console.log(err);
    resp.send({ message: "An error occured", status: 0, request: {} });
  }
});

//Drop Collection
router.post("/saveRequest", async function (req, resp, next) {
  var route = req.body;
  route.date = new Date();

  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo.collection("requests").insertOne(route, function (err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();

        fetchAvailableRiders(req.body.pick_up_coordinates, (res_) => {
          console.log("res>>>", res_);
          if (res_.length) {
            let assign_json = res_.map((available_rider, i) => {
              return {
                uid: available_rider.uid,
                status: i == 0 ? 1 : 0,
              };
            });
            assignRequestToRider(res.ops[0]._id, assign_json);
            createNotification(
              res_[0].device_id,
              "You have a new delivery request",
              (notif) => {
                console.log("notif", notif);
                resp.send({
                  status: 1,
                  response: "Notification sent",
                  message: "Success",
                });
              }
            );
          } else {
            resp.send({
              status: 0,
              response: "No rider available",
              message: "Failed",
            });
          }
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});
function updateRequestAssignJSON(_id, uid,status,callback) {
  try {
    getRequestById(_id, (request) => {
      console.log("🚀 ~ file: requests.js ~ line 142 ~ getRequestById ~ res", request);
      let assign_json = request.assign_json.map((request)=>{
        return{
          uid:request.uid,
          status:request.uid == uid?status:request.status
        }
      })
      mongo.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        var myquery = { _id: ObjectId(_id) };
        var newvalues = { $set: { assign_json } };
        dbo
          .collection("requests")
          .updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("assign json updated successfully");
            callback(request);
            db.close();
          });
      });
    });
  } catch (err) {}
}
//Drop Collection
router.post("/updateStatusRequest", async function (req, resp, next) {
  var _id = req.body._id;
  var status = req.body.status;
  var is_rider = req.body.is_rider;
  var uid = req.body.uid;
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      var myquery = { _id: ObjectId(_id) };
      var newvalues = { $set: { status } };
      dbo
        .collection("requests")
        .updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;
          db.close();
          resp.send({
            status: 1,
            message: "Update successful",
            response: {},
          });
          if(is_rider){
            //update assign json
            updateRequestAssignJSON(_id,uid,status,(request)=>{
              console.log("🚀 ~ file: requests.js ~ line 192 ~ updateRequestAssignJSON ~ request", request)
              //send notification if status is okay
              getUsertById(request.request_initiator_uid,(user)=>{
                if(status == 2){
                  createNotification(user.device_notification_id,"Your request has been accepted by a rider");
  
                }
              })
            
            })
          }
        });
    });
  } catch (err) {
    resp.send({
      status: 0,
      message: "Update failed",
      response: {},
    });
  }
});

function fetchAvailableRiders(pick_up_coordinates, callback) {
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("users")
        .find({ type: "2" })
        .toArray(function (err, res) {
          console.log("all riders", JSON.stringify(res));
          //get the disance between
          //filter the riders with no coordinates
          let valid_riders = res.filter((rider) =>
            rider.hasOwnProperty("current_location")
          );
          console.log("valid_riders-->", valid_riders);
          let available_riders = valid_riders.map((rider) => {
            return {
              uid: rider.uid,
              device_id: rider.device_notification_id,
              pick_up_distance: getDistanceFromLatLonInKm(
                rider.current_location.latitude,
                rider.current_location.longitude,
                pick_up_coordinates.latitude,
                pick_up_coordinates.longitude
              ),
            };
          });
          callback(
            available_riders.sort((a, b) =>
              a.pick_up_distance > b.pick_up_distance ? 1 : -1
            )
          );
        });
    });
  } catch (err) {
    console.log(err);
  }
}
function assignRequestToRider(_id, assign_json) {
  try {
    mongo.connect(url, function (err, db) {
      if (err) {
        resp.send({
          status: 0,
          message: "Error:Error occured connecting",
          response: {},
        });
      }
      var dbo = db.db("xlparser");
      var myquery = { _id: ObjectId(_id) };
      var newvalues = { $set: { assign_json } };
      dbo
        .collection("requests")
        .updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;
          console.log(_id, " request assigned to rider ", assign_json);
          db.close();
        });
    });
  } catch (err) {
    console.log(err);
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;
