'use strict';

var utils = require("./utils");

exports.handle = function(app)
{
    app.get('/', function (req, res) {res.render('index.html');});
}