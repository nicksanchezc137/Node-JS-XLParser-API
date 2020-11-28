var mongo = require("mongodb").MongoClient;

const { ObjectId } = require("mongodb");
var url = "mongodb://127.0.0.1:27017/xlparser";

function getAllUsers(callback) {
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
        .find({ status: 1 })
        .toArray(function (err, res) {
          if (err) {
            //resp.send({ status: 0, message: "Error:" + res, response: {} });
            callback([]);
          }
          console.log(res);
          callback(res);
        });
    });
  } catch (err) {
    console.log(err);
    callback([]);
    //resp.send({ status: 0, message: "Error:" + err, response: {} });
  }
}

function getUsertById(_id, callback) {
  console.log("user _id", _id);
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("users")
        .find({ _id: ObjectId(_id.trim()) })
        .toArray(function (err, res) {
          if (err) throw err;
          console.log(res);
          if (res.length) {
            callback(res[0]);
          }
        });
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = { getUsertById, getAllUsers };
