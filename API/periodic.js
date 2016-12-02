'use strict';

const g_rpc = require('./rpc');
const g_syncTX = require('./syncTransaction');
const g_syncBlocks = require("./syncBlocks");
const g_syncAddr = require("./syncAddr");
const g_syncAddr2 = require("./syncAddr2");

var g_mempool = [];
exports.GetMempoolTXs = function() {return g_mempool};

exports.UpdateTransactions = function()
{
    g_rpc.getrawmempool('', function(rpcRet) {
       // rpcRet.data = ["89bbac49f87c18b01eb418aa134d9a84a7b8a2b6356e61a96313afb134ba0cfd"];
        if (!rpcRet || rpcRet.status != 'success' || !rpcRet.data)
            return;
       
        g_mempool = [];
        for (var i=0; i<rpcRet.data.length; i++)
        {
            g_mempool.push({'txid' : rpcRet.data[i]});
        }
    });
};

exports.StartSyncronize = function()
{
    g_syncBlocks.Sync();
    g_syncTX.Sync();
    g_syncAddr.Sync();
    g_syncAddr2.Sync();
};

