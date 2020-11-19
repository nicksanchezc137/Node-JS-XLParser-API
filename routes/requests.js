var express = require("express");
var router = express.Router();
var mongo = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const OneSignal = require("onesignal-node");
const client = new OneSignal.Client(
  "34f658cc-57c6-4277-a09c-f8d16e888f43",
  "MDAxMWZlNTgtMTk1Yy00YjVlLTkyMmYtNmEwNmNmZjViNGMz"
);

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

const createNotification = (device_id,callback) => {
  //create notification
  const notification = {
    contents: {
      en: "You have a delivery request",
    },
    include_player_ids: [device_id],
    filters: [],
  };
  client
    .createNotification(notification)
    .then((response) => {
      console.log("createNotification -> response", response);
      callback(true);
    })
    .catch((e) => {
      console.log("createNotification -> e", e);
      callback(false);
    });
};

//Drop Collection
router.post("/saveRequest", async function (req, resp, next) {
  var route = req.body;

  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo.collection("requests").insertOne(route, function (err, res) {
        if (err) throw err;
        console.log("1 document inserted", res);
        db.close();
        resp.send(res.ops[0]);
        fetchAvailableRiders(req.body.pick_up_coordinates, (res) => {
          console.log("res>>>", res);
          //createNotification(notification, () => {});
          createNotification(res[0].device_id,(notif)=>{
          console.log("notif", notif)

          });
        });
      });
    });
  } catch (err) {
    console.log(err);
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
          // console.log("res-->", JSON.stringify(res));
          //get the disance between
          //filter the riders with no coordinates
          let valid_riders = res.filter((rider)=>rider.hasOwnProperty('current_location'));
          console.log("valid_riders-->", valid_riders)
          let available_riders = valid_riders.map((rider) => {
            return {
              uid: rider.uid,
              device_id:rider.device_notification_id,
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
