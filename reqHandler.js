'use strict';

const utils = require("./utils");
const url = require('url');
const apiSearchV1 = require('./API/v1/search');
const apiTransactionsV1 = require('./API/v1/transactions');
const apiBlocksV1 = require('./API/v1/blocks');

exports.handle = function(app)
{
    app.get('/', function (req, res) {res.render('index.html');});
    app.get('/api/v1/search', onV1Search);
    app.get('/api/v1/getmempool', onV1Mempool);
    app.get('/api/v1/getlastblocks', onV1Blocks);
    app.get('/api/v1/getlasttransactions', onV1Transactions);
    
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
    
    function onV1Mempool(req, res)
    {
      try {
        const query = url.parse(req.url, true).query;
        
        apiTransactionsV1.GetMempool(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1Blocks(req, res)
    {
      try {
        const query = url.parse(req.url, true).query;
        
        apiBlocksV1.GetBlocks(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1Transactions(req, res)
    {
      try {
        const query = url.parse(req.url, true).query;
        
        apiTransactionsV1.GetLast(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
}