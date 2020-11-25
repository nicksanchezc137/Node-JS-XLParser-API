var mongo = require("mongodb").MongoClient;
var url = "mongodb://127.0.0.1:27017/xlparser";

function getAllRequests(callback){
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
            .collection("requests")
            .find({ status:1 })
            .toArray(function (err, res) {
              if (err) {
                //resp.send({ status: 0, message: "Error:" + res, response: {} });
                callback([]);
              }
              console.log(res);
              callback(res)
            });
        });
      } catch (err) {
        console.log(err);
        callback([]);
        //resp.send({ status: 0, message: "Error:" + err, response: {} });
      }
}


module.exports = {getAllRequests};