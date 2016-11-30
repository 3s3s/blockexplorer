'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');
const g_saveTX = require('./saveTransaction');

var g_mempool = [];
exports.GetMempoolTXs = function() {return g_mempool};

//var g_blockkount = 0;
//exports.GetBlockCount = function() {return g_blockkount};

//var g_nInitSyncFrom = 0;

exports.UpdateTransactions = function()
{
    g_rpc.getrawmempool('', function(rpcRet) {
        g_mempool = rpcRet;
    });
};

exports.StartSyncronize = function()
{
    g_rpc.getblockcount('', function(rpcRet) {
        if (rpcRet.status != 'success')
        {
            setTimeout(exports.StartSyncronize, 10000);
            return;
        }
        
        const aBlockNumbers = function() {
            var ret = [];
            for (var i=0; i<rpcRet.data; i++) ret.push(i);
           // for (var i=0; i<30; i++) ret.push(i);
            return ret;
        } ();
        
        g_utils.ForEach(aBlockNumbers, SaveBlock);
        g_utils.ForEach(aBlockNumbers, SaveTransactions);
    });
    
    function SaveBlock(aBlockNumbers, nIndex, callback)
    {
        if (!aBlockNumbers || !aBlockNumbers.length || aBlockNumbers.length <= nIndex)
        {
            callback(false);
            return;
        }
        
        g_constants.dbTables['Blocks'].selectAll("height", "height="+aBlockNumbers[nIndex], "", function(error, rows) {
            if (error)
            {
                //if database error - wait 10 sec and try again
                callback(true, 10000);
                return;
            }
            
            if (rows.length)
            {
                //if block found in database - return for process new block
                callback(false);
                return;
            }
            
            //if block not found in database then call rpc to get block hash
            g_rpc.getblockhash({'nBlock' : aBlockNumbers[nIndex]}, function (rpcRet) {
                if (rpcRet.status != 'success')
                {
                    //if rpc error then wait 10 sec and try again
                    callback(true, 10000);
                    return;
                }
                
                //call rpc to get full block info
                g_rpc.getblock({'hash' : rpcRet.data}, function(rpcRet2) {
                    if (rpcRet2.status != 'success' || !rpcRet2.data.hash)
                    {
                        //if rpc error then wait 10 sec and try again
                        callback(true, 10000);
                        return;
                    }
                    
                    const arrayTX = (typeof rpcRet2.data.tx === 'string') ? [].push(rpcRet2.data.tx) : rpcRet2.data.tx;
                        
                    g_constants.dbTables['Blocks'].insert(
                        rpcRet2.data.hash,
                        rpcRet2.data.size,
                        rpcRet2.data.height,
                        rpcRet2.data.version,
                        rpcRet2.data.merkleroot,
                        rpcRet2.data.time,
                        rpcRet2.data.nonce,
                        rpcRet2.data.bits,
                        rpcRet2.data.difficulty,
                        rpcRet2.data.previousblockhash || "",
                        rpcRet2.data.nextblockhash || "",
                        rpcRet2.data.ip || "",
                        JSON.stringify(arrayTX) || "[]"
                    );
                    
                    //we do not known the 'insert' result, so try do same work again for thee case if insert failed
                    callback(true, 100);
                    return;
                });
            });

        });
    }
    
    function SaveTransactions(aBlockNumbers, nIndex, callback)
    {
        if (!aBlockNumbers || !aBlockNumbers.length || aBlockNumbers.length <= nIndex)
        {
            callback(false);
            return;
        }
        
        //get saved transactions
        g_constants.dbTables['Transactions'].selectAll("blockHeight", "blockHeight="+aBlockNumbers[nIndex], "", function(error, rows) {
            if (error)
            {
                //if database error - wait 10 sec and try again
                callback(true, 10000);
                return;
            }
            
            if (rows.length)
            {
                //if transactions already saved then process new block
                callback(false);
                return;
            }
            
            //get block from database
            g_constants.dbTables['Blocks'].selectAll("*", "height="+aBlockNumbers[nIndex], "", function(error, rowBlocks) {
                if (error || !rowBlocks || !rowBlocks.length)
                {
                    //if database error (or block not found) - wait 10 sec and try again
                    callback(true, 10000);
                    return;
                }
                
                //Save transactions from table 'Blocks' in array    
                const txInBlock = function() {
                    var tmp = JSON.parse(unescape(rowBlocks[0].tx));
                    var ret = [];
                    for (var i=0; i<tmp.length; i++)
                        ret.push({'txid' : tmp[i], 'blockHash' : rowBlocks[0].hash, 'blockHeight' : rowBlocks[0].height});
                    return ret;
                } (); 
                
                console.log("try save transactions for block="+aBlockNumbers[nIndex]);
                g_utils.ForEach(txInBlock, g_saveTX.SaveTX, function() {
                    callback(false);
                });
            });
        });
        
    }
};

/*exports.UpdateBlocks = function()
{
    g_rpc.getblockcount('', function(rpcRet) {
        if (rpcRet.status != 'success')
            return;
        
        g_blockkount = rpcRet.data;
        
        g_constants.dbTables['Blocks'].selectAll("size", "", "", function(error, rows) {
            if (error)
                return;
            
            if (rows.length == g_blockkount)
                return;
            
            g_nInitSyncFrom = rows.length;
        });
    });
};

function SyncBlocks()
{
    if (g_nInitSyncFrom == g_blockkount) return;
    
    g_rpc.getblockhash({'nBlock' : g_nInitSyncFrom}, function (rpcRet) {
        if (rpcRet.status != 'success')
            return;
            
        g_utils.IsBlockExist(rpcRet.data, function(flag) {
            if (flag)
            {
                g_nInitSyncFrom++;
                return;
            }
            g_rpc.getblock({'hash' : rpcRet.data}, function(rpcRet2) {
                if (rpcRet2.status != 'success' || !rpcRet2.data.hash)
                    return;
                    
                const arrayTX = (typeof rpcRet2.data.tx === 'string') ? [].push(rpcRet2.data.tx) : rpcRet2.data.tx;
                    
                g_constants.dbTables['Blocks'].insert(
                    rpcRet2.data.hash,
                    rpcRet2.data.size,
                    rpcRet2.data.height,
                    rpcRet2.data.version,
                    rpcRet2.data.merkleroot,
                    rpcRet2.data.time,
                    rpcRet2.data.nonce,
                    rpcRet2.data.bits,
                    rpcRet2.data.difficulty,
                    rpcRet2.data.previousblockhash || "",
                    rpcRet2.data.nextblockhash || "",
                    rpcRet2.data.ip || "",
                    JSON.stringify(arrayTX) || "[]"
                );
            });
        }); 
    });
}

function SyncTransactions()
{
    //Get current height of sync block with transactions (it stored in key-value table)
    g_constants.dbTables['KeyValue'].get('CurrSyncBlock', function(err, nBlockHeight) {
        if (err || nBlockHeight=="")
        {
            g_constants.dbTables['KeyValue'].set('CurrSyncBlock', 0);
            return;
        }
       
        //Get block from database
        g_utils.GetBlockByHeight(nBlockHeight, function(error, rows) {
            if (error || !rows || rows.length != 1)
                return;
                
            //Save transactions from table 'Blocks' in sorted array    
            const txInBlock = JSON.parse(unescape(rows[0].tx)).sort();
            
            //Get transactions for given block from table 'Transactions'
            g_utils.GetBlockTransactions(rows[0].hash, function(errorTx, rowsTx) {
                if (errorTx || !rowsTx || !rowsTx.length)
                {
                    //if error then try to save transactions from block to database
                    SaveTransactions(rows[0].hash, txInBlock);
                    return;
                }
                
                var txInTransactions = [];
                for (var i=0; i<rowsTx.length; i++) txInTransactions.push(rowsTx[i].txid);
                
                //Compare transactions in tables 'Blocks' and 'Transactions' for block nBlockHeight
                if (JSON.stringify(txInBlock)==JSON.stringify(txInTransactions.sort()))
                {
                    //if transactions in block is equal with transactions in database - then increase block height
                    g_constants.dbTables['KeyValue'].set('CurrSyncBlock', parseInt(nBlockHeight)+1);
                    return;
                }
                
                SaveTransactions(rows[0].hash, txInBlock);
            });
            
        });
    });
    
    function SaveTransactions(hash, arrayTx)
    {
        for (var i=0; i<arrayTx.length; i++)
        {
            g_constants.dbTables['Transactions'].insert(
                hash,
                arrayTx[i].txid,
                arrayTx[i].locktime | 0,
                arrayTx[i].vin | "",
                arrayTx[i].vout | ""
            );
        }
    }
}

exports.Syncronize = function()
{
    SyncBlocks();
    SyncTransactions();

};*/