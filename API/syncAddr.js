'use strict';

const g_constants = require('../constants');
const g_utils = require('../utils');
const g_db = require("./database")

exports.SaveFromTransaction = function(aTXs, nTX, cbRet)
{
    if (!aTXs || !aTXs.length || aTXs.length <= nTX)
    {
        cbRet(false);
        return;
    }
                    
    //find transaction in table
    g_constants.dbTables['Transactions'].selectAll("*", "txid='"+aTXs[nTX].txid+"'", "", function(error, rowsTx) {
        if (error)
        {
            //if database error - wait 10 sec and try again
            cbRet(true, 10000);
            return;
        }
        
        //iterate array of transactions
        g_utils.ForEach(rowsTx, SaveOutputs, function() {
            g_utils.ForEach(rowsTx, SaveInputs, function() {
                cbRet(false);
            });
        });
    });
};

function SaveOutputs(aTXs, nIndex, callback)
{
    try
    {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            callback(false);
            return;
        }
        if (!aTXs[nIndex].txid || !aTXs[nIndex].txid.length)
        {
            throw 'SaveOutputs: no txid found!!!';
        }

        const aVout = JSON.parse(unescape(aTXs[nIndex].vout));
        
        var aInfoForSave = [];
        for (var i=0; i<aVout.length; i++)
        {
            if (!aVout[i].scriptPubKey)
                aVout[i].scriptPubKey = {'addresses' : ['??? (nonstandart)']};
            if (!aVout[i].scriptPubKey.addresses)
                aVout[i].scriptPubKey.addresses = ['??? (nonstandart)'];
                
            for (var j=0; j<aVout[i].scriptPubKey.addresses.length; j++)
            {
                aInfoForSave.push({
                    'addr' : aVout[i].scriptPubKey.addresses[j], 
                    'scriptPubKey' : aVout[i].scriptPubKey,
                    'value' : aVout[i].value || "0",
                    'txin' : aTXs[nIndex].txid,
                    'time' : aTXs[nIndex].time || "0",
                    'n' : aVout[i].n || "0",
                    'height' : aTXs[nIndex].blockHeight || 0
                    });
            }
        }
    
        g_utils.ForEach(aInfoForSave, SaveAddress, function() {callback(false);});
        /*g_db.BeginTransaction(function(){
            g_utils.ForEach(aInfoForSave, SaveAddress, function() {
                g_db.EndTransaction(function(){callback(false);});
            });   
        });*/
    }
    catch(e)
    {
        callback(false);
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
                aInfoForSave[nIndex].addr || JSON.stringify(['???']),
                JSON.stringify(aInfoForSave[nIndex].scriptPubKey) || JSON.stringify([]),
                aInfoForSave[nIndex].value,
                aInfoForSave[nIndex].txin,
                "0",
                aInfoForSave[nIndex].time,
                aInfoForSave[nIndex].n,
                aInfoForSave[nIndex].height,
                function(err) {
                    if (err) 
                    {
                        callback(true, 10000);
                        return;
                    }
                    callback(false);
                }
            );
        });
        
        return;
    }
}

function SaveInputs(aTXs, nIndex, callback)
{
    try
    {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            callback(false);
            return;
        }
        
        if (!aTXs[nIndex].txid || !aTXs[nIndex].txid.length)
        {
            throw 'SaveInputs: no txid found!!!';
        }

        const aVin = JSON.parse(unescape(aTXs[nIndex].vin));
        
        var aInfoForSave = [];
        for (var i=0; i<aVin.length; i++)
        {
            if (!aVin[i].txid)
                continue;
            //if (!aVin[i].txid || !aVin[i].vout)
            //    continue;

            aInfoForSave.push({
                'txid' : aVin[i].txid,
                'vout' : aVin[i].vout || 0,
                'parent' : aTXs[nIndex].txid
            });
        }
     
        g_utils.ForEach(aInfoForSave, UpdateAddress, function() {
            //g_constants.dbTables['KeyValue'].set('LastSyncTxTime', aTXs[nIndex].time);
            callback(false);
        });
    }
    catch(e)
    {
        callback(false);
    }   
    
    function UpdateAddress(aInfoForSave, nIndex, callback)
    {
        if (!aInfoForSave || aInfoForSave.length <= nIndex)
        {
            callback(false);
            return;
        }
        
        //check if address present in database
        const WHERE = "txin='"+aInfoForSave[nIndex].txid+"' AND number="+aInfoForSave[nIndex].vout;
        g_constants.dbTables['Address'].selectAll("number", WHERE, "", function(e, r) {
            if (e || !r)
            {
                //if database error then try again after 10 sec
                callback(true, 10000);
                return;
            }
            
            if (!r.length)
            {
                //adress is not synced yet then wait it
               // throw 'UpdateAddress: no input address found!!!';
                callback(true, 10000);
                return;
            }
            //check if addres already processed
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
                g_constants.dbTables['Address'].update(SET, WHERE, function(err2) {
                    if (err2)
                    {
                        //if database error then try again after 10 sec
                        callback(true, 10000);
                        return;
                    }
                    callback(false);
                });
                
                //we do not known the 'update' result, so try do same work again for thee case if iupdate failed
                //callback(true, 100);
            });
        });
    }
}

