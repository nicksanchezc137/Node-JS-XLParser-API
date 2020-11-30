var express = require("express");
var router = express.Router();
var mongo = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");

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
router.get("/getUser", function (req, resp, next) {
  let uid = req.query.uid;
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
      dbo
        .collection("users")
        .find({ uid })
        .toArray(function (err, res) {
          if (err) {
            resp.send({ status: 0, message: "Error:" + res, response: {} });
          }
          console.log(res);
          resp.send({
            status: 1,
            message: res[0] ? "Success" : "No such user",
            response: res[0],
          });
        });
    });
  } catch (err) {
    console.log(err);
    resp.send({ status: 0, message: "Error:" + err, response: {} });
  }
});

/* GET List item*/
router.post("/updateLocationDetails", function (req, resp, next) {
  let uid = req.body.uid;
  let current_location = req.body.current_location;

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
      var myquery = { uid };
      var newvalues = { $set: { current_location } };
      dbo
        .collection("users")
        .updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;
          resp.send({
            status: 1,
            message: "Rider Details Updated",
            response: current_location,
          });
          db.close();
        });
    });
  } catch (err) {
    console.log(err);
    resp.send({ status: 0, message: "Error:" + err, response: {} });
  }
});
/* GET List item*/
router.post("/updateUserNotification", function (req, resp, next) {
  let uid = req.body.uid;
  let device_notification_id = req.body.device_notification_id;

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
      var myquery = { uid };
      var newvalues = { $set: { device_notification_id } };
      dbo
        .collection("users")
        .updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;
          resp.send({
            status: 1,
            message: "User Details Updated",
            response: device_notification_id,
          });
          db.close();
        });
    });
  } catch (err) {
    console.log(err);
    resp.send({ status: 0, message: "Error:" + err, response: {} });
  }
});
//check if user exists
function checkIfExists(email, phone, callback) {
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("users")
        .find({
          $or: [
            {
              email,
            },
            {
              phone,
            },
          ],
        })
        .toArray(function (err, res) {
          if (err) {
            callback([], true);
          }
          console.log(res);
          callback(res), false;
        });
    });
  } catch (err) {
    console.log(err);
  }
}

//Drop Collection
router.post("/saveUser", async function (req, resp, next) {
  var user = req.body;

  checkIfExists(user.email, user.phone, (fetched_users, err) => {
    if (err) {
      resp.send({
        status: 0,
        message: "error occurred fetching user",
        response: {},
      });
      return;
    }
    if (fetched_users.length) {
      resp.send({ status: 0, message: "user already exists!", response: {} });
      return;
    }
    try {
      mongo.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("users").insertOne(user, function (err, res) {
          if (err) throw err;
          console.log("1 document inserted", res);
          db.close();
          resp.send({
            status: 1,
            response: res.ops[0],
            message: "User created!",
          });
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
});


router.post("/updateUser", async function (req, resp, next) {
  var user = req.body;

  checkIfExists(user.email, user.phone, (fetched_users, err) => {
    if (err) {
      resp.send({
        status: 0,
        message: "error occurred fetching user",
        response: {},
      });
      return;
    }
    if (fetched_users.length) {
      resp.send({ status: 0, message: "user already exists!", response: {} });
      return;
    }
    try {
      mongo.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        var myquery = { uid };
        var newvalues = { $set: { name:user.name,phone:user.phone } };
        dbo
          .collection("users")
          .updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;
          console.log("1 document updated", res);
          db.close();
          resp.send({
            status: 1,
            response: res.ops[0],
            message: "User updated!",
          });
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
});

module.exports = router;
