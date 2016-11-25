'use strict';

const utils = require("./utils");
const url = require('url');

exports.handle = function(app)
{
    app.get('/', function (req, res) {res.render('index.html');});
    app.get('/api/v1/search', onV1Search);
    
    function onV1Search(req, res)
    {
      try {
        const query = url.parse(req.url, true).query;
        
        res.end(JSON.stringify({query: query}));
      } 
      catch(e) {
        console.log(e.message);
      }
        
    }
}