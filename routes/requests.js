var express = require("express");
var router = express.Router();
var mongo = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const OneSignal = require('onesignal-node');    
const client = new OneSignal.Client('34f658cc-57c6-4277-a09c-f8d16e888f43', 'MDAxMWZlNTgtMTk1Yy00YjVlLTkyMmYtNmEwNmNmZjViNGMz');

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

//create notification
const notification = {
  contents: {
    tr: "Yeni bildirim",
    en: "New notification",
  },
  included_segments: ["Subscribed Users"],
  filters: [],
};
const createNotification = (notification, callback) => {
    client
    .createNotification(notification)
    .then((response) => {
    console.log("createNotification -> response", response)
      callback(true);
    })
    .catch((e) => {
    console.log("createNotification -> e", e)
      callback(false);
    });
};



//Drop Collection
router.post("/saveRequest", async function (req, resp, next) {
  var route = req.body;
   createNotification(notification,()=>{

   })
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo.collection("requests").insertOne(route, function (err, res) {
        if (err) throw err;
        console.log("1 document inserted", res);
        db.close();
        resp.send(res.ops[0]);
      });
    });
  } catch (err) {
    console.log(err);
  }
});


module.exports = router;
