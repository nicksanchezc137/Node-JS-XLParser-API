var express = require("express");
var router = express.Router();
var xlsx = require('node-xlsx').default;
var mongo = require("mongodb").MongoClient;
const { v4: uuidv4 } = require("uuid");
var multer = require("multer");
var moment = require("moment");
var XLSX = require("xlsx");

var file_name = "";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb('', "uploads/");
  },
  filename: function (req, file, cb) {
    file_name = `${uuidv4()}-${file.originalname}`;
    cb('', file_name);
  },
});
const upload = multer({ storage: storage });
var entity = "";
var errors_array = [];
var validated_rows = [];
//all entities
const entities = [
  {
    name: "stocktake",
    fields: [
      {
        prop: "Category",
        type: "String",
        required: true,
      },
      {
        prop: "SKU",
        type: "String",
        required: true,
      },
      {
        prop: "Group ID",
        type: "Number",
        required: true,
      },
      {
        prop: "Product Type",
        type: "String",
        required: true,
      },
      {
        prop: "Product",
        type: "String",
        required: true,
      },
      {
        prop: "Variant",
        type: "String",
        required: true,
      },
      {
        prop: "Reorder",
        type: "Number",
        required: true,
      },
      {
        prop: "Cost Price",
        type: "Number",
        required: true,
      },
      {
        prop: "Retail Price",
        type: "Number",
        required: true,
      },
      {
        prop: "Margin",
        type: "Number",
        required: true,
      },
      {
        prop: "branch_id",
        type: "Number",
        required: true,
      },
      {
        prop: "Supplier",
        type: "String",
        required: true,
      },
      {
        prop: "Tax",
        type: "String",
        required: true,
      },
      {
        prop: "Quantity",
        type: "Number",
        required: true,
      },
      {
        prop: "Serial Number",
        type: "String",
        required: false,
      },
      {
        prop: "serialized",
        type: "Number",
        required: true,
      },
      {
        prop: "expiry_date",
        type: "Date",
        required: false,
      },
    ],
    //unique_fields: ["SKU"],
  },
];

router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

var url = "mongodb://127.0.0.1:27017/xlparser";

/*POST receive the file*/
router.post("/sendFile", upload.single("datafile"), function (req, res, next) {
    errors_array = [];
  console.log("the file name is ", file_name);
  console.log("file name is ", req.body);
  entity = req.body.entity;
  readFileData(res);
});

const readFileData = async (res) => {
  var workbook = XLSX.readFile(`uploads/${file_name}`,{raw:true});
  var main_sheet = workbook.SheetNames;
  var rows = XLSX.utils.sheet_to_json(workbook.Sheets[main_sheet[0]]);
  let num_cat = rows.filter((x)=> !isNaN(x.Category))
  console.log("the rows are ---",num_cat.length);
  validateRows(rows);
 // console.log("validated rows are ",validated_rows," errors are ", errors_array);
  res.send(errors_array);
  //save the data to mongodb
  saveData();
};

function validateRow(row,index) {
    //validate all rows based on schema
  const fields = entities.filter((x)=>x.name === entity)[0].fields;
  for(var i =0; i < fields.length;i++) {
    //check if the field is required
    if (fields[i].required) {
      if (row.hasOwnProperty(fields[i].prop)) {
        //check if property has data
        if (!row[fields[i].prop] && row[fields[i].prop]!=0) {
            addError({index,column:fields[i].prop,description:`${fields[i].prop} cannot be empty`})  
          return false;
        }
      } else {
        addError({index,column:fields[i].prop,description:`${fields[i].prop} cannot be empty`})
        return false;
      }
    }

    //validate numbers
    if (fields[i].type == "Number") {
      if (isNaN(row[fields[i].prop])) {
        addError({index,column:fields[i].prop,description:`${fields[i].prop} must be a number`})
        return false;
      }
    }
    //validate date only if it exists
    if (fields[i].type == "Date" && row.hasOwnProperty(fields[i].prop)) {
      if (!moment(row[fields[i].prop], "MM/DD/YYYY", true).isValid()) {
        addError({index,column:fields[i].prop,description:`${fields[i].prop} must be a valid date format`})
        return false;
      }
    }
   
  }
   //return true if all checks are passed
   return true;
}

function addError(error){
   errors_array.push(error)
}

function validateRows(rows) {
  rows.forEach((x, i) => {
    if (validateRow(x,i)) {
      validated_rows.push(x)
    }
  });

}

const saveData = () => {
  //save the rows in mongo db
  mongo.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("xlparser");
    //create unique compute index for unique fields
   // dbo.collection(entity).createIndex({ SKU: 1 }, { unique: true });
    try {
      dbo
        .collection(entity)
        .insertMany(validated_rows, { ordered: false }, function (err, res) {
          if (err) throw err;
          console.log(res + " document(s) inserted");
          db.close();
        });
    } catch (err) {
      console.log(err);
    }
  });
};

//get the data file using buffer
/* GET List item*/
router.get('/getFile', async function(req, resp, next) {
    try{
    mongo.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("xlparser");
        dbo.collection("stocktake").find({}).project({_id:0}).toArray( function(err, res) {
            if (err) throw err;
            console.log(res);
            resp.send(res);
          });
      });
    }catch(err){
        console.log(err)
    }
});

router.get('/getTemplate', async function(req, resp, next) {
       
    try{
        const stocktake_template = [ { Category: '',
        SKU: '',
        'Group ID': '',
        'Product Type': '',
        Product:'',
        Variant: '',
        Reorder: '',
        'Cost Price': '',
        'Retail Price':'',
        Margin: '',
        branch_id: '',
        Supplier: '',
        Tax:'',
        Quantity: '',
        serialized: ''},]
        resp.send(stocktake_template);
    }catch(err){
        console.log(err)
    }
});

module.exports = router;
