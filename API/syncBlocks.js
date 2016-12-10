'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');
const g_transactions = require("./syncTransaction");
const g_db = require("./database");

exports.Sync = function()
{
    //try
   // {
        g_rpc.getblockcount('', function(rpcRet) {
            if (rpcRet.status != 'success')
            {
                setTimeout(exports.Sync, 10000);
                return;
            }
            
            //find last synced block by height
            g_constants.dbTables['Blocks'].selectAll("height", "", "ORDER BY height DESC LIMIT 1", function(error, rows) {
                if (error || !rows)
                {
                    //if database error then try again after 10 sec
                    setTimeout(exports.Sync, 10000);
                    return;
                }
                
               // const heightStart = 0;// rows.length ? (rows[0].height) : 0;
                const heightStart = (rows.length && rows[0].height > 1000) ? (rows[0].height-1000) : 0;
                const heightEnd = rpcRet.data; //rpcRet.data - heightStart > 100 ? heightStart+100 : rpcRet.data;

                const aBlockNumbers = function() {
                    var ret = [];
                    for (var i=heightStart; i<heightEnd; i++) ret.push(i);
                    return ret;
                } ();
                
                console.log('start from '+heightStart);
                g_utils.ForEachSync(aBlockNumbers, SaveBlock, function(){
                    //when all synced (or have error) then try again after 10 sec
                    setTimeout(exports.Sync, 10000);
                }, function(err, nIndex, cbError){
                    //when one function return
                    if (err) {
                        throw 'Block sync error';
                        cbError(true);
                        return;
                    }
                    g_transactions.SaveFromBlock(aBlockNumbers, nIndex, cbError);
                });
            });
        });
   /* }
    catch(e)
    {
        setTimeout(exports.Sync, 30000);
    }*/
};

function SaveBlock(aBlockNumbers, nIndex, cbError)
{
    if (!aBlockNumbers || !aBlockNumbers.length || aBlockNumbers.length <= nIndex)
    {
        cbError(true);
        return;
    }
        
    g_constants.dbTables['Blocks'].selectAll("height", "height="+aBlockNumbers[nIndex], "", function(error, rows) {
        if (error)
        {
            //if database error - wait 10 sec and try again
            cbError(true);
            return;
        }
            
        if (rows.length)
        {
            //if block found in database - return for process new block
            console.log('block #'+aBlockNumbers[nIndex]+' alredy in db');
            cbError(false);
            return;
        }
            
        //if block not found in database then call rpc to get block hash
        g_rpc.getblockhash({'nBlock' : aBlockNumbers[nIndex]}, function (rpcRet) {
            if (rpcRet.status != 'success')
            {
                //if rpc error then wait 10 sec and try again
                cbError(true);
                return;
            }
                
            //call rpc to get full block info
            g_rpc.getblock({'hash' : rpcRet.data}, function(rpcRet2) {
                if (rpcRet2.status != 'success' || !rpcRet2.data.hash)
                {
                    //if rpc error then wait 10 sec and try again
                    cbError(true);
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
                    JSON.stringify(arrayTX) || "[]",
                    cbError
                );
            });
        });
    });
}
