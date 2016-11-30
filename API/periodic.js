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
        
        var nBlockStartSyncFrom = 0;
        g_constants.dbTables['Blocks'].selectAll("*", "", "ORDER BY height DESC LIMIT 1", function(error, rows) {
            if (!error && rows.length)
                nBlockStartSyncFrom = parseInt(rows[0].height); //start sync blocks from max height saved nubmer

            const aBlockNumbers = function() {
                var ret = [];
                //for (var i=nBlockStartSyncFrom; i<rpcRet.data; i++) ret.push(i);
                for (var i=nBlockStartSyncFrom; i<500; i++) ret.push(i);
                return ret;
            } ();
            
            const aTxNumbers = function() {
                var ret = [];
                for (var i=0; i<rpcRet.data; i++) ret.push(i);
                return ret;
            } ();
            
            g_utils.ForEach(aBlockNumbers, SaveBlock);
            g_utils.ForEach(aTxNumbers, SaveTransactions);
        });
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

