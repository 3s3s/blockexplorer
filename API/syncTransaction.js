'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');
const g_address = require("./syncAddr");

var g_Transactions = [];
exports.SaveTxFromBlock = function(block, cbError)
{
    //Save transactions from table 'Blocks' in array    
    const txInBlock = function() {
        var tmp = JSON.parse(unescape(block.tx));
        var ret = [];
        for (var i=0; i<tmp.length; i++)
            ret.push({'txid' : tmp[i], 'blockHash' : block.hash, 'blockHeight' : block.height, 'blockTime' : block.time});
        return ret;
    } (); 
                
    g_Transactions = [];
    console.log("syncTransactions: try save transactions for block="+block.height);
        
    g_utils.ForEachAsync(txInBlock, SaveTX, function(err) {
        if (err) throw 'unexpected error in SaveTxFromBlock';
        g_address.SaveFromTransaction(g_Transactions, cbError);  
    });
};

function SaveTX(aTXs, nTX, cbError)
{
    console.log('SaveTX start');
    if (!aTXs || !aTXs.length || aTXs.length <= nTX)
    {
        cbError(true);
        return;
    }
                    
    //find transaction in table
   // g_constants.dbTables['Transactions'].selectAll("*", "txid='"+aTXs[nTX].txid+"'", "LIMIT 1", function(error, rowTX) {
    /*    console.log('SaveTX select * from Transactions return');
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
            console.log('tx already in db n='+nTX+'   ('+aTXs.length+')');
            g_address.SaveFromTransaction(rowTX, cbError);
            return;
        }*/
        
         g_rpc.getrawtransaction({'txid' : aTXs[nTX].txid}, function (rpcRet) {
            console.log('SaveTX g_rpc.getrawtransaction return');
            if (rpcRet.status != 'success')
            {
                console.log('RPC ERROR getrawtransaction: txid='+aTXs[nTX].txid);
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
                console.log('SaveTX g_rpc.decoderawtransaction return');
                if (rpcRet2.status != 'success')
                {
                    //if rpc error then wait 10 sec and try again
                    console.log('RPC ERROR decoderawtransaction: txid='+aTXs[nTX].txid);
                    cbError(true);
                    return;
                }
                
                aTXs[nTX].time = rpcRet2.data.time || aTXs[nTX].blockTime;
                aTXs[nTX].vin = JSON.stringify(rpcRet2.data.vin) || "[]";
                aTXs[nTX].vout = JSON.stringify(rpcRet2.data.vout) || "[]";
                
                /*const rowTX = {
                    blockHash: aTXs[nTX].blockHash,
                    blockHeight: aTXs[nTX].blockHeight,
                    txid: aTXs[nTX].txid,
                    time: aTXs[nTX].time,
                    vin: aTXs[nTX].vin,
                    vout: aTXs[nTX].vout,
                };*/
                g_constants.dbTables['Transactions'].insert(
                    aTXs[nTX].blockHash,
                    aTXs[nTX].blockHeight,
                    aTXs[nTX].txid,
                    aTXs[nTX].time,
                    aTXs[nTX].vin,
                    aTXs[nTX].vout,
                    function(err) {
                        console.log('SaveTX insert2 return');
                        if (err) //throw 'unexpected insert error to Transactions table'
                        {
                            if (err.errno != 19) //throw 'unexpected insert error to Transactions table'
                            //console.log('ERROR inserting transaction message: '+err.message);
                            console.log('tx already in db n='+nTX+'   ('+aTXs.length+')');
                            g_address.SaveFromTransaction(aTXs[nTX], cbError);
                            return;
                        }
                        //g_address.SaveOutputsFromTransaction([ aTXs[nTX] ], cbError);
                        console.log('success inserted transaction txid='+aTXs[nTX].txid);
                        g_Transactions.push( aTXs[nTX] );
                        cbError(false);
                    }
                );
            });
         });
    //});
}
