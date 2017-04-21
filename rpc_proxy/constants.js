'use strict'

const fs = require("fs");

exports.g_bDebug = false;
exports.my_port = 5563;

exports.options = {
    key: fs.readFileSync(__dirname + "../server.key"),
    cert: fs.readFileSync(__dirname + "../server.crt")
}

exports.proxyHost = "localhost";
exports.proxyPort = "8339";

