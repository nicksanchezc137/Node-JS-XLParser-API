var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb')

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

var url = " mongodb://127.0.0.1:27017/xlparser"

/* GET List item*/
router.get('/getRequest/:id', async function(req, resp, next) {
    let _id = req.params.id
    try{
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("requests").find({}).project({_id}).toArray( function(err, res) {
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
router.post('/saveRequest', async function(req, resp, next) {
    var route = req.body.route;
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("requests").insertOne(route, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted",res);
            db.close();
          });
      });
});







 
module.exports = router;
