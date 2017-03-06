'use strict';

const fs = require("fs");

const options = {
    key: fs.readFileSync(__dirname + "/server2.key"),
    cert: fs.readFileSync(__dirname + "/cryptobank_uk.crt")
};

const http = require('http');
const https = require('https');
const periodic = require('./API/periodic');

const g_constants = require('./constants');
const auth = require('./app/auth');

const session =  require('express-session');

var FileStore = require('session-file-store')(session);

var express = require('express'),
	exphbs  = require('express-handlebars').create({defaultLayout: 'main'}),
	flash = require('connect-flash'),
	expressValidator = require('express-validator');
	
var helpers = require('handlebars-helpers')({
    hbs: exphbs.handlebars
});

var app = express();
app.use(flash());
app.engine('handlebars', exphbs.engine);
app.set('view engine', 'handlebars');

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;
/*
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};*/

app.use(expressValidator());
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
app.use(session({
    secret: 'strong secret',
	resave: true,
	saveUninitialized: true,
    store: new FileStore()
}));

// your express configuration here

app.use(express.static('site'));

app.use(function (req, res, next) {
	app.locals.url = req.path;
	app.locals.user = req.session.user || null;
	next();
});
auth.handle(app);
require('./reqHandler.js').handle(app);
require('./app/cards/CardsRouter.js').handle(app);


var httpServer = http.createServer(function (req, res) {
	var host = req.headers['host'].split(':');
    res.writeHead(301, { "Location": "https://" + host[0] + (g_constants.my_portSSL != 443 ? (':' + g_constants.my_portSSL) : '') + req.url });
    res.end();
});
var httpsServer = https.createServer(options, app);


httpServer.listen(g_constants.my_port,function(){
	console.log("http listening on port "+g_constants.my_port);
});
httpsServer.listen(g_constants.my_portSSL, function(){
    console.log("SSL Proxy listening on port "+g_constants.my_portSSL);
});


/*process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});*/

/* stop requests for development*/
require("./API/database").Init();

periodic.UpdateTransactions();  

setInterval(periodic.UpdateTransactions, 10000);

periodic.StartSyncronize();/**/

