'use strict';

const rpc = require('../rpc');
const db = require('../database');

exports.process = function(query, res)
{
   /* rpc.getblockcount(query, function(rpcRet) {
        res.end(JSON.stringify(rpcRet));
    });*/
    
    query.nBlock = 1;
    rpc.getblockhash(query, function(rpcRet) {
        res.end(JSON.stringify(rpcRet));
    })
}