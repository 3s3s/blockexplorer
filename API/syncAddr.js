'use strict';

const g_constants = require('../constants');
const g_utils = require('../utils');

exports.Sync = function()
{
    try
    {
        //find address with max time
        g_constants.dbTables['Address'].selectAll("*", "", "ORDER BY time DESC LIMIT 1", function(error, rows) {
            if (error || !rows)
            {
                //if database error then try again after 10 sec
                setTimeout(exports.Sync, 10000);
                return;
            }
            
            //find transactions with time >= max address time
            const strWhere = rows.length ? "time >= " + escape(rows[0].time) : "";
            g_constants.dbTables['Transactions'].selectAll("*", strWhere, "", function(err, rowsTX) {
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
    try
    {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            callback(false);
            return;
        }
        
        const aVout = JSON.parse(unescape(aTXs[nIndex].vout));
        
        var aInfoForSave = [];
        for (var i=0; i<aVout.length; i++)
        {
            if (!aVout[i].scriptPubKey || !aVout[i].scriptPubKey.addresses)
                continue;
            for (var j=0; j<aVout[i].scriptPubKey.addresses.length; j++)
            {
                aInfoForSave.push({
                    'addr' : aVout[i].scriptPubKey.addresses[j] || "[]", 
                    'scriptPubKey' : aVout[i].scriptPubKey || "",
                    'value' : aVout[i].value || "0",
                    'txin' : aTXs[nIndex].txid || "",
                    'time' : aTXs[nIndex].time || "0",
                    'n' : aVout[i].n || "0"
                    });
            }
        }
    
        g_utils.ForEach(aInfoForSave, SaveAddress, function() {
            callback(false);
        });        
    }
    catch(e)
    {
        callback(false);
    }

}

function SaveAddress(aInfoForSave, nIndex, callback)
{
    //check - if address already present in database
    const WHERE = "address='"+aInfoForSave[nIndex].addr+"' AND txin='"+aInfoForSave[nIndex].txin+"' AND number="+aInfoForSave[nIndex].n;
    g_constants.dbTables['Address'].selectAll("number", WHERE, "LIMIT 1", function(error, rows) {
        if (error || !rows)
        {
            //if database error then try again after 10 sec
            callback(true, 10000);
            return;
        }
        
        if (rows.length)
        {
            //if address found then process new address
            callback(false);
            return;
        }
        
        g_constants.dbTables['Address'].insert(
            aInfoForSave[nIndex].addr,
            JSON.stringify(aInfoForSave[nIndex].scriptPubKey) || "[]",
            aInfoForSave[nIndex].value,
            aInfoForSave[nIndex].txin,
            "0",
            aInfoForSave[nIndex].time,
            aInfoForSave[nIndex].n
        );
                    
        //we do not known the 'insert' result, so try do same work again for thee case if insert failed
        callback(true, 100);
    });
    
    return;
}