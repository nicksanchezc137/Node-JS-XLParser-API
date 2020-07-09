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
router.get('/getData/:limit/:page', async function(req, resp, next) {
    const limit  = Number(req.params.limit);
    const page = Number(req.params.page);
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("stocktake").find().skip(page * limit).limit(limit).toArray( function(err, res) {
            if (err) throw err;
        
            resp.send(res);
    
          });
      });
});

//Drop Collection
router.post('/clear', async function(req, resp, next) {
    var entity = req.body.entity;
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection(entity).drop().then((res)=>{
            resp.send({message:"OK"})
        })
      });
});





 
module.exports = router;
