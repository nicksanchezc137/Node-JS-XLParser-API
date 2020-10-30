var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

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
router.get('/getRoute/:id', async function(req, resp, next) {
    let _id = req.params.id
    try{
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("routes").find({}).project({_id:_id}).toArray( function(err, res) {
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
    var route = req.body.route;
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("routes").insertOne(route, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted",res);
            db.close();
          });
      });
});







 
module.exports = router;
