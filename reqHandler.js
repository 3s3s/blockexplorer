'use strict';

const utils = require("./utils");
const url = require('url');
const apiSearchV1 = require('./API/v1/search');

exports.handle = function(app)
{
    app.get('/', function (req, res) {res.render('index.html');});
    app.get('/api/v1/search', onV1Search);
    
    function onV1Search(req, res)
    {
      try {
        const query = url.parse(req.url, true).query;
        
        apiSearchV1.process(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
        
    }
}