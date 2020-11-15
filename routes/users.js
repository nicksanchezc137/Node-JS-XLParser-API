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
  let _id = req.query.id;
  console.log("_id", _id);
  try {
    mongo.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("xlparser");
      dbo
        .collection("users")
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
            callback([],true);
          }
          console.log(res);
          callback(res),false;
        });
    });
  } catch (err) {
    console.log(err);
  }
}

//Drop Collection
router.post("/saveUser", async function (req, resp, next) {
  var user = req.body;

  checkIfExists(user.email, user.phone, (fetched_users,err) => {
    if(err){
      resp.send({status:0,message:"error occurred fetching user"});
      return;
    }
    if(fetched_users.length){
      resp.send({status:0,message:"user already exists!"});
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
          resp.send({status:1,message:res.ops[0]});
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
});

module.exports = router;
