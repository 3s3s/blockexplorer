'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');

exports.SaveTX = function(aTXs, nTX, cbRet)
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
