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
                
            var nBlockStartSyncFrom = 0;
            g_constants.dbTables['Blocks'].selectAll("*", "", "ORDER BY height DESC LIMIT 1", function(error, rows) {
                if (!error && rows.length)
                    nBlockStartSyncFrom = parseInt(rows[0].height); //start sync blocks from max height saved nubmer
        
                const aBlockNumbers = function() {
                    var ret = [];
                    for (var i=nBlockStartSyncFrom; i<rpcRet.data; i++) ret.push(i);
                    //for (var i=nBlockStartSyncFrom; i<500; i++) ret.push(i);
                    return ret;
                } ();
                    
                g_utils.ForEach(aBlockNumbers, SaveBlock, function() {
                    setTimeout(exports.Sync, 30000);
                });
            });
        });
    }
    catch(e)
    {
        setTimeout(exports.Sync, 30000);
    }
};

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
                    JSON.stringify(arrayTX) || "[]",
                    function(err) {
                        if (err) 
                        {
                            callback(true, 10000);
                            return;
                        }
                        callback(false);
                    }
                );
                    
                //we do not known the 'insert' result, so try do same work again for thee case if insert failed
               // callback(true, 100);
                //callback(false);
              //  return;
            });
        });
    });
}
