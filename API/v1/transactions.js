'use strict';

const g_rpc = require("../rpc");
const periodic = require("../periodic");
const g_constants = require('../../constants');
const g_utils = require('../../utils');


exports.GetMempool = function(query, res)
{
    g_utils.WaitBlockSync(()=>{ 
        res.end( JSON.stringify({'status' : 'success', 'data' : periodic.GetMempoolTXs()}) );
    });
};

exports.GetLast = function(query, res)
{
    g_utils.WaitBlockSync(()=>{ 
        g_utils.GetLastUnSyncAddrTransactions(10, function(error, rows) {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
        });
    });
};

exports.GetTransaction = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }

    g_utils.WaitBlockSync(()=>{ 
        g_utils.GetTxByHash(query.hash, function(result) {
            res.end( JSON.stringify(result) );
        });
    });
};

exports.PushTransaction = function(body, res)
{
    if (!body || !body.hex)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead {"hex" : "TX_HASH"})'}) );
        return;
    }
    
    g_rpc.sendrawtransaction({'tx' : body.hex}, function (rpcRet) {
        res.end( JSON.stringify(rpcRet) );
    });
};

exports.GetTransactionInfo = function(query, res)
{
    const aTXs = query.split(',');
    
    let retResult = [];
    
    g_utils.WaitBlockSync(()=>{ 
        g_rpc.getblockcount("", function(result) {
            if (result.status != 'success')
            {
                res.end( JSON.stringify({'status' : false, 'message' : 'rpc getblockcount failed'}) );
                return;
            }
            
            let ret = {lastblock : parseInt(result.data), txs : []};

            g_utils.ForEachSync(aTXs, SaveTX, function(){
                ret.txs = retResult;
                res.end( JSON.stringify(ret) ); 
            });
        });
    });
    
    function SaveTX(aTXs, nIndex, cbError)
    {
        g_utils.GetTxByHash(aTXs[nIndex], function(result) {
            if (result.status == 'success' && result.data)
            {
                for (var i=0; i<result.data.length; i++)
                    retResult.push(result.data[i]);
            }
            cbError(false);
        });
    }
};
