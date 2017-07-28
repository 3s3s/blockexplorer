'use strict';

const utils = require("./utils");
const url = require('url');
const apiSearchV1 = require('./API/v1/search');
const apiTransactionsV1 = require('./API/v1/transactions');
const apiBlocksV1 = require('./API/v1/blocks');
const apiAddressV1 = require('./API/v1/address');

exports.handle = function(app)
{
    app.get('/api/v1/address/txinfo/*', onV1GetTransactionInfo);
    app.get('/api/v1/address/generate', onV1GenerateAddress);
    app.post('/api/v1/tx/pushtx', onV1PushTx);

////////////////////////////////////////////////////////////////////////////////
    app.get('/', function (req, res) {res.render('index.html');});
    app.get('/api/v1/search', onV1Search);
    app.get('/api/v1/getmempool', onV1Mempool);
    app.get('/api/v1/getlastblocks', onV1Blocks);
    app.get('/api/v1/getlasttransactions', onV1Transactions);
    app.get('/api/v1/getblock', onV1GetBlock);
    app.get('/block/*', function (req, res) {
      res.sendFile(__dirname + '/site/index.html');});
    app.get('/transaction/*', function (req, res) {res.sendFile(__dirname + '/site/index.html');});
    app.get('/address/*', function (req, res) {res.sendFile(__dirname + '/site/index.html');});
    app.get('/api/v1/gettransaction', onV1GetTransaction);
    app.get('/api/v1/getaddress', onV1GetAddress);
    
    app.get('/api/v1/address/balance/*', onV1GetAddressBalance);
    app.get('/api/v1/address/txs/*', onV1GetTransactionsByAddress);
    app.get('/api/v1/address/unconfirmed/*', onV1GetUnconfirmedTransactionsByAddress);
    app.get('/api/v1/address/unspent/*', onV1GetUnspentTransactionsByAddress);
    app.get('/api/v1/totalsup', onV1GetTotalSupply);
    app.post('/api/v1/tx/push', onV1PushTransaction);
  
    function onV1Search(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiSearchV1.process(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    
    function onV1GetTotalSupply(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "text/plain"});
        const query = url.parse(req.url, true).query;
        
        apiBlocksV1.GetTotalSupply(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    
    function onV1Mempool(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
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
        res.writeHead(200, {"Content-Type": "application/json"});
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
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiTransactionsV1.GetLast(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1GetTransaction(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiTransactionsV1.GetTransaction(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1GetAddress(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiAddressV1.GetAddress(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1GetBlock(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiBlocksV1.GetBlock(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1GetAddressBalance(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const path = url.parse(req.url, true).path;
        const query = path.substr(path.lastIndexOf('/')+1);
        const addrOnly = query.substr(0, (query.indexOf('?') == -1) ? query.length : query.indexOf('?'));
        
        apiAddressV1.GetAddressBalance(addrOnly, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    
    function onV1GetTransactionsByAddress(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const path = url.parse(req.url, true).path;
        const query = path.substr(path.lastIndexOf('/')+1);
        const addrOnly = query.substr(0, (query.indexOf('?') == -1) ? query.length : query.indexOf('?'));
        
        apiAddressV1.GetTransactionsByAddress(addrOnly, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    function onV1GetUnconfirmedTransactionsByAddress(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const path = url.parse(req.url, true).path;
        const query = path.substr(path.lastIndexOf('/')+1);
        const addrOnly = query.substr(0, (query.indexOf('?') == -1) ? query.length : query.indexOf('?'));
        
        apiAddressV1.GetUnconfirmedTransactionsByAddress(addrOnly, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    
    function onV1GetUnspentTransactionsByAddress(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const path = url.parse(req.url, true).path;
        const query = path.substr(path.lastIndexOf('/')+1);
        const addrOnly = query.substr(0, (query.indexOf('?') == -1) ? query.length : query.indexOf('?'));
        
        apiAddressV1.GetUnspentTransactionsByAddress(addrOnly, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }

    function onV1PushTransaction(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});

        apiTransactionsV1.PushTransaction(req.body, res);
      } 
      catch(e) {
        console.log(e.message);
      }
    }
    
    function onV1GetTransactionInfo(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const path = url.parse(req.url, true).path;
        const query = path.substr(path.lastIndexOf('/')+1);
        const addrOnly = query.substr(0, (query.indexOf('?') == -1) ? query.length : query.indexOf('?'));
        
        apiTransactionsV1.GetTransactionInfo(addrOnly, res);
      } 
      catch(e) {
        console.log(e.message);
      }
      
    }
    function onV1GenerateAddress(req, res)
    {
      try {
        res.writeHead(200, {"Content-Type": "application/json"});
        const query = url.parse(req.url, true).query;
        
        apiAddressV1.GenerateAddress(query, res);
      } 
      catch(e) {
        console.log(e.message);
      }
      
    }
    

};