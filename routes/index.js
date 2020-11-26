var express = require('express');
var router = express.Router();
const { ObjectId } = require("mongodb");
var mongo = require("mongodb").MongoClient;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//Drop Collection
router.post('/deleteById', async function(req, resp, next) {
  var request = req.body;

  try{
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection(request.collection).deleteOne( {"_id": ObjectId(request._id)});
      });
    }catch(err){
        console.log(err)
    }
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
