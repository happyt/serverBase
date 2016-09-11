var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");

//======================
// for mongo db
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
// table name
var ENTRIES_COLLECTION = "entries";
// Connection URL
var DBLINK = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Create a database variable outside of the database connection callback
// to reuse the connection pool in your app.
var db;
//
//==================

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(DBLINK, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

//=======================
// web server
//
var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// web port
var PORT = process.env.PORT || 8080; 
//
//=======================
// Initialize the app.
//
    var server = app.listen(PORT, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });

// ENTRIES API ROUTES BELOW

    // Generic error handler used by all endpoints.
    function handleError(res, reason, message, code) {
        console.log("ERROR: " + reason);
        res.status(code || 500).json({"error": message});
    }

    /*  "/entries"
    *    GET: finds all entries
    *    POST: creates a new contact
    */

    app.get("/entries", function(req, res) {
        db.collection(ENTRIES_COLLECTION).find({}).toArray(function(err, docs) {
            if (err) {
                handleError(res, err.message, "Failed to get entries.");
            } else {
                res.status(200).json(docs);
            }
        });
    });
    

    // add new record to entries
    app.post("/entries", function(req, res) {
        console.log(req.body);
        var newEntry = req.body;
        console.log("body:", req.body);
        newEntry.createDate = new Date();

        if (!req.body.name || !req.body.code) {
            handleError(res, "Invalid input, Must provide a name AND code.", 400);
        }
        else {  
            db.collection(ENTRIES_COLLECTION).insertOne(newEntry, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to create new entry.");
            } else {
                res.status(201).json(doc.ops[0]);
            }
            });
        }
    });

    /*  "/entries/:id"
    *    GET: find contact by id
    *    PUT: update contact by id
    *    DELETE: deletes contact by id
    */

    app.get("/entries/:id", function(req, res) {
        db.collection(ENTRIES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
            if (err) {
            handleError(res, err.message, "Failed to get entry");
            } else {
            res.status(200).json(doc);
            }
        });
    });

    app.put("/entries/:id", function(req, res) {
        var updateDoc = req.body;
        delete updateDoc._id;

        db.collection(ENTRIES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
            if (err) {
            handleError(res, err.message, "Failed to update entry");
            } else {
            res.status(204).end();
            }
        });
    });

    app.delete("/entries/:id", function(req, res) {
        db.collection(ENTRIES_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
            if (err) {
            handleError(res, err.message, "Failed to delete entry");
            } else {
            res.status(204).end();
            }
        });
    });

});

