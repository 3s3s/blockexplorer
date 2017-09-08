'use strict';

const g_db = require('./database');

const g_rpc = require('./rpc');
const g_syncTX = require('./syncTransaction');
const g_syncBlocks = require("./syncBlocks");
const g_syncAddr = require("./syncAddr");
const g_utils = require('../utils');

var g_mempool = [];
exports.GetMempoolTXs = function() {return g_mempool;};

var g_blockcount = 0;
exports.GetBlockCount = function() {return g_blockcount;};

exports.UpdateBlockCount = function()
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }';
    
    g_rpc.rpcPostJSON(strJSON, (ret) => {
        if (ret.data >= 0)
            g_blockcount = ret.data;
    });
    
}

exports.UpdateTransactions = function()
{
    let tmpPool = [];
    g_rpc.getrawmempool('', function(rpcRet) {
//        rpcRet.data = ["55cc1c283a2b27b48fa73470ab2ed7b473953c2cc4b98e7a51eebb6951333b81"];
        if (!rpcRet || rpcRet.status != 'success')
            return;
            
        if (!rpcRet.data.length)
        {
            g_mempool = [];
            return;
        }
        
        g_utils.ForEachSync(rpcRet.data, SaveMemPool, function(){
            g_mempool = tmpPool;
        });
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
                
                for (var i=0; i<tmpPool.length; i++)
                {
                    if (tmpPool[i].txid == txid)
                    {
                        cbError(false);
                        return;
                    }
                }
                tmpPool.push(rpcRet2.data);
                tmpPool[tmpPool.length-1]['txid'] = txid;
                cbError(false);
            });
        });

    }

};

exports.StartSyncronize = function()
{
    g_utils.SetSyncState(false);
    
    g_syncBlocks.Sync();
    //g_syncTX.Sync();
    //g_syncAddr.Sync();
    //g_syncAddr2.Sync();
    
    //g_db.RunTransactions();
};

