'use strict';

const g_constants = require('../constants');
const g_utils = require('../utils');

exports.Sync = function()
{
    try
    {
        //get time for last sync transaction
        g_constants.dbTables['KeyValue'].get('LastSyncTxTime', function(error, rows) {
            if (error || rows == undefined)
            {
                //if database error then try again after 10 sec
                setTimeout(exports.Sync, 10000);
                return;
            }
            
            //find transactions with time >= last sync
            const strWhere = rows.length ? "time>= " + rows : "";
            g_constants.dbTables['Transactions'].selectAll("*", strWhere, "ORDER BY time ASC", function(err, rowsTX) {
                if (err || !rowsTX)
                {
                    //if database error then try again after 10 sec
                    setTimeout(exports.Sync, 10000);
                    return;
                }
                
                //iterate array of transactions
                g_utils.ForEach(rowsTX, SaveAddresses, function() {
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

function SaveAddresses(aTXs, nIndex, callback)
{
    if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
    {
        callback(false);
        return;
    }
    
    const aVin = JSON.parse(unescape(aTXs[nIndex].vin));
    
    var aInfoForSave = [];
    for (var i=0; i<aVin.length; i++)
    {
        if (!aVin[i].txid || !aVin[i].vout)
            continue;
            
        aInfoForSave.push({
            'txid' : aVin[i].txid,
            'vout' : aVin[i].vout,
            'parent' : aTXs[nIndex].txid
        });
    }

    g_utils.ForEach(aInfoForSave, SaveAddress, function() {
        g_constants.dbTables['KeyValue'].set('LastSyncTxTime', aTXs[nIndex].time);
        callback(false);
    });
}

function SaveAddress(aInfoForSave, nIndex, callback)
{
    if (!aInfoForSave || aInfoForSave.length <= nIndex)
    {
        callback(false);
        return;
    }
    
    //check if address present in database
    g_constants.dbTables['Address'].selectAll("number", "txin='"+aInfoForSave[nIndex].txid+"'", "", function(e, r) {
        if (e || !r)
        {
            //if database error then try again after 10 sec
            callback(true, 10000);
            return;
        }
        
        if (!r.length)
        {
            //adress is not synced yet then wait it
            callback(true, 10000);
            return;
        }

        //check if addres already processed
        const WHERE = "txin='"+aInfoForSave[nIndex].txid+"' AND number="+aInfoForSave[nIndex].vout;
        g_constants.dbTables['Address'].selectAll("number", WHERE+" AND txout='"+aInfoForSave[nIndex].parent+"'", "", function(error, rows) {
            if (error || !rows)
            {
                //if database error then try again after 10 sec
                callback(true, 10000);
                return;
            }
            
            if (rows.length)
            {
                //if record found then process next transaction and address
                callback(false);
                return;
            }
            
            const SET = "txout='"+aInfoForSave[nIndex].parent+"'";
            g_constants.dbTables['Address'].update(SET, WHERE);
            
            //we do not known the 'update' result, so try do same work again for thee case if iupdate failed
            callback(true, 100);
        });

    });
    
}
