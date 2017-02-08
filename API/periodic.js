'use strict';

const g_db = require('./database');

const g_rpc = require('./rpc');
const g_syncTX = require('./syncTransaction');
const g_syncBlocks = require("./syncBlocks");
const g_syncAddr = require("./syncAddr");
const g_utils = require('../utils');

var g_mempool = [];
exports.GetMempoolTXs = function() {return g_mempool};

exports.UpdateTransactions = function()
{
    g_rpc.getrawmempool('', function(rpcRet) {
//        rpcRet.data = ["55cc1c283a2b27b48fa73470ab2ed7b473953c2cc4b98e7a51eebb6951333b81"];
        if (!rpcRet || rpcRet.status != 'success' || !rpcRet.data)
            return;
            
        var tmpPool = [];
        for (var i=0; i<rpcRet.data.length; i++)
        {
            for (var j=0; j<g_mempool.length; j++)
            {
                if (g_mempool[j].txid == rpcRet.data[i])
                    tmpPool.push(g_mempool[j]);
            }
        }
        g_mempool = tmpPool;

        g_utils.ForEachSync(rpcRet.data, SaveMemPool, function(){});
    });
    
    function SaveMemPool(aTXs, nIndex, cbError)
    {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            cbError(false);
            return;
        }
        
        const txid = aTXs[nIndex];
        g_rpc.getrawtransaction({'txid' : txid}, function (rpcRet) {
            if (rpcRet.status != 'success')
            {
                console.log('SaveMemPool RPC ERROR getrawtransaction: txid='+txid);
                cbError(false);
                return;
            }

            g_rpc.decoderawtransaction({'tx' : rpcRet.data}, function (rpcRet2) {
                if (rpcRet2.status != 'success')
                {
                    console.log('SaveMemPool RPC ERROR decoderawtransaction: txid='+txid);
                    cbError(false);
                    return;
                }
                
                for (var i=0; i<g_mempool.length; i++)
                {
                    if (g_mempool[i].txid == txid)
                    {
                        cbError(false);
                        return;
                    }
                }
                g_mempool.push(rpcRet2.data);
                g_mempool[g_mempool.length-1]['txid'] = txid;
            });
        });

    }

};

exports.StartSyncronize = function()
{
    g_syncBlocks.Sync();
    //g_syncTX.Sync();
    //g_syncAddr.Sync();
    //g_syncAddr2.Sync();
    
    //g_db.RunTransactions();
};

