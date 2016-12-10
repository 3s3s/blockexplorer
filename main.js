'use strict';

const http = require('http');
const periodic = require('./API/periodic');

const g_constants = require('./constants');

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};


// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// your express configuration here

var httpServer = http.createServer(app);

httpServer.listen(g_constants.my_port);

app.use(express.static('site'));

require('./reqHandler.js').handle(app);

/*process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});*/

require("./API/database").Init();

periodic.UpdateTransactions();  setInterval(periodic.UpdateTransactions, g_constants.intervals.mempool_tx);

periodic.StartSyncronize();
/*
periodic.UpdateBlocks();        setInterval(periodic.UpdateBlocks, g_constants.intervals.block);
periodic.Syncronize();          setInterval(periodic.Syncronize, g_constants.intervals.synchronization);*/

