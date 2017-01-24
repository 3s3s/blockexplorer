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
       // rpcRet.data = ["89bbac49f87c18b01eb418aa134d9a84a7b8a2b6356e61a96313afb134ba0cfd"];
        if (!rpcRet || rpcRet.status != 'success' || !rpcRet.data)
            return;
        
        g_mempool = [];    
        g_utils.ForEachSync(rpcRet.data, SaveMemPool, function(){
            
        });
       
        /*g_mempool = [];
        for (var i=0; i<rpcRet.data.length; i++)
        {
            g_mempool.push({'txid' : rpcRet.data[i]});
        }*/
    });
    
    function SaveMemPool(aTXs, nIndex, cbError)
    {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            cbError(false);
            return;
        }
        
        g_rpc.getrawtransaction({'txid' : aTXs[nIndex]}, function (rpcRet) {
            if (rpcRet.status != 'success')
            {
                console.log('SaveMemPool RPC ERROR getrawtransaction: txid='+aTXs[nIndex]);
                cbError(false);
                return;
            }

            g_rpc.decoderawtransaction({'tx' : rpcRet.data}, function (rpcRet2) {
                if (rpcRet2.status != 'success')
                {
                    console.log('SaveMemPool RPC ERROR decoderawtransaction: txid='+aTXs[nIndex]);
                    cbError(false);
                    return;
                }
                
                g_mempool.push(rpcRet2.data);
                g_mempool[g_mempool.length-1]['txid'] = aTXs[nIndex];
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

