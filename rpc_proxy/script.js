'use strict'

const constants = require("./constants");
const url = require('url');

const server = constants.g_bDebug ? require("http").createServer() : require("https").createServer(constants.options);

server.listen(constants.my_port, function() {
    console.log("SSL Proxy listening on port " + constants.my_port);
});

server.addListener("request", function(request, response) {

    console.log("Init session");

    var ph = url.parse(request.url);
    var options = {
        port: constants.proxyPort,
        hostname: constants.proxyHost,
        method: request.method,
        path: ph.path,
        headers: request.headers
    };

    options.headers.host = constants.proxyHost;

    var proxyRequest = require("http").request(options);

    proxyRequest.on('response', function(proxyResponse) {
        console.log("Got proxy responce status=" + proxyResponse.statusCode);
    
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    
        proxyResponse.on('data', function(chunk) {
            response.write(chunk, 'binary');
        });
            
        proxyResponse.on('end', function() {
            response.end();
        });
    });

    request.on('data', function(chunk) {
        proxyRequest.write(chunk, 'binary')
    });

    request.on('end', function() { proxyRequest.end() });

    proxyRequest.on('error', function(e) {
        console.log('proxyRequest error' + JSON.stringify(e));
    });
});

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});
