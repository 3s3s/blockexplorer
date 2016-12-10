'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');
const g_address = require("./syncAddr");

exports.SaveFromBlock = function(aBlockNumbers, nIndex, cbError)
{
    if (!aBlockNumbers || !aBlockNumbers.length || aBlockNumbers.length <= nIndex)
    {
        cbError(true);
        return;
    }
        
    g_constants.dbTables['Blocks'].selectAll("*", "height="+aBlockNumbers[nIndex], "", function(error, rowBlocks) {
        if (error || !rowBlocks || !rowBlocks.length)
        {
            //if database error - wait 10 sec and try again
            cbError(true);
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
        
        g_utils.ForEachAsync(txInBlock, SaveTX, cbError);
        /*var nTx = 0;
        SaveTX(txInBlock, nTx, onEndTransactionSave);
        
        function onEndTransactionSave(err, n)
        {
            if (n) throw 'SaveTX: unexpected argument n';
            if (err)
            {
                callback(err);
                return;
            }
            
        }
        /*for (var i=0; i<txInBlock.length; i++)
        {
            SaveTX(txInBlock, i, function(err, n){
                if (n) throw 'SaveTX: unexpected argument n';
                if (err) throw 'unexpected error in transaction save';
            });
        }*/
        /*g_utils.ForEach(txInBlock, SaveTX, function(nRepeat, nTimeout) {
            
        });*/
    });
};


function SaveTX(aTXs, nTX, cbError)
{
    if (!aTXs || !aTXs.length || aTXs.length <= nTX)
    {
        cbError(true);
        return;
    }
                    
    //find transaction in table
    g_constants.dbTables['Transactions'].selectAll("*", "txid='"+aTXs[nTX].txid+"'", "", function(error, rowTX) {
        if (error)
        {
            //if database error - wait 10 sec and try again
            cbError(true);
            return;
        }
                            
        if (rowTX.length)
        {
            //if transaction found then process new transaction
            //cbError(false);
            g_address.SaveFromTransaction(aTXs, nTX, cbError);
            return;
        }
        
         g_rpc.getrawtransaction({'txid' : aTXs[nTX].txid}, function (rpcRet) {
            if (rpcRet.status != 'success')
            {
                if (rpcRet.data && rpcRet.data.length)
                {
                    //if rpc failed but return valid data, then continue process new transaction
                    cbError(false);
                    return;
                }
                //if rpc error then wait 10 sec and try again
                cbError(true);
                return;
            }

            g_rpc.decoderawtransaction({'tx' : rpcRet.data}, function (rpcRet2) {
                if (rpcRet2.status != 'success')
                {
                    //if rpc error then wait 10 sec and try again
                    cbError(true);
                    return;
                }
                
                g_constants.dbTables['Transactions'].insert(
                    aTXs[nTX].blockHash,
                    aTXs[nTX].blockHeight,
                    aTXs[nTX].txid,
                    rpcRet2.data.time || 0,
                    JSON.stringify(rpcRet2.data.vin) || "[]",
                    JSON.stringify(rpcRet2.data.vout) || "[]",
                    function(err) {
                        if (err) 
                        {
                            cbError(true);
                            return;
                        }
                        g_constants.dbTables['Transactions'].selectAll("*", "txid='"+aTXs[nTX].txid+"'", "", function(error, rowTX) {
                            if (error || !rowTX || !rowTX.length) throw 'unexpected insert error!';
                            g_address.SaveFromTransaction(aTXs, nTX, cbError);
                        });
                        
                    }
                );
            });
         });
    });
}
