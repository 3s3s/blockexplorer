'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');

exports.Sync = function()
{
    try
    {
        g_rpc.getblockcount('', function(rpcRet) {
            if (rpcRet.status != 'success')
            {
                setTimeout(exports.Sync, 10000);
                return;
            }
                
            var nTxStartSyncFrom = 0;
            g_constants.dbTables['Transactions'].selectAll("*", "", "ORDER BY blockHeight DESC LIMIT 1", function(error, rows) {
                if (!error && rows.length && parseInt(rows[0].blockHeight) > 1)
                    nTxStartSyncFrom = parseInt(rows[0].blockHeight) - 1; //start sync transactions from max height saved nubmer minus 1
                    
                //array with numbers for sync
                const aTxNumbers = function() {
                    var ret = [];
                    for (var i=nTxStartSyncFrom; i<rpcRet.data; i++) ret.push(i);
                    return ret;
                } ();
                    
                //iterate array
                g_utils.ForEach(aTxNumbers, SaveTransactions, function() {
                    setTimeout(exports.Sync, 30000); //after end - try again periodicaly
                });
            });
        });
    }
    catch(e)
    {
        setTimeout(exports.Sync, 30000);
    }
};

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
            g_utils.ForEach(txInBlock, SaveTX, function() {
                callback(false);
            });
            

        });
    });
}

function SaveTX(aTXs, nTX, cbRet)
{
    if (!aTXs || !aTXs.length || aTXs.length <= nTX)
    {
        cbRet(false);
        return;
    }
                    
    //find transaction in table
    g_constants.dbTables['Transactions'].selectAll("*", "txid='"+aTXs[nTX].txid+"'", "", function(error, rowTX) {
        if (error)
        {
            //if database error - wait 10 sec and try again
            cbRet(true, 10000);
            return;
        }
                            
        if (rowTX.length)
        {
            //if transaction found then process new transaction
            cbRet(false);
            return;
        }
        
         g_rpc.getrawtransaction({'txid' : aTXs[nTX].txid}, function (rpcRet) {
            if (rpcRet.status != 'success')
            {
                if (rpcRet.data && rpcRet.data.length)
                {
                    //if rpc failed but return valid data, then continue process new transaction
                    cbRet(false);
                    return;
                }
                //if rpc error then wait 10 sec and try again
                cbRet(true, 10000);
                return;
            }

            g_rpc.decoderawtransaction({'tx' : rpcRet.data}, function (rpcRet2) {
                if (rpcRet2.status != 'success')
                {
                    //if rpc error then wait 10 sec and try again
                    cbRet(true, 10000);
                    return;
                }
                
                g_constants.dbTables['Transactions'].insert(
                    aTXs[nTX].blockHash,
                    aTXs[nTX].blockHeight,
                    aTXs[nTX].txid,
                    rpcRet2.data.time || 0,
                    JSON.stringify(rpcRet2.data.vin) || "[]",
                    JSON.stringify(rpcRet2.data.vout) || "[]"
                );
                
                //we do not known the 'insert' result, so try do same work again for thee case if insert failed
                cbRet(true, 100);
                return;
            });
         });
    });
}
