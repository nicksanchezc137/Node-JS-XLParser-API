var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');




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
router.get('/getRoute',  function(req, resp, next) {
    let _id = req.query.id
    console.log("_id", _id)
    try{
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("routes").find({_id:ObjectId(_id)}).toArray( function(err, res) {
            if (err) throw err;
            console.log(res);
            resp.send(res);
          });
      });
    }catch(err){
        console.log(err)
    }
});


//Drop Collection
router.post('/saveRoute', async function(req, resp, next) {
    var route = req.body;
 
    try{
      mongo.connect(url, function(err, db) {
          if (err) throw err;
          var dbo = db.db("xlparser");
          dbo.collection("routes").insertOne(route, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted",res);
            db.close();
            resp.send(res.ops[0]);
          });
        });
      }catch(err){
          console.log(err)
      }
});







 
module.exports = router;
