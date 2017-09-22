'use strict';

const g_constants = require('../constants');
const g_utils = require('../utils');
const g_db = require("./database");

exports.SaveFromTransaction = function(aTXs, cbError)
{
    g_utils.ForEachSync(aTXs, SaveOutputs, function(err){
        if (err) throw 'unexpectd SaveFromTransaction  error';
        g_utils.ForEachSync(aTXs, SaveInputs, cbError);
    });
};

function SaveOutputs(aTXs, nIndex, cbError)
{
    console.log('SaveOutputs start');
   // try
  //  {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            cbError(true);
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
                    'key' : aTXs[nIndex].txid+(aVout[i].n || "0"),
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
    
        g_utils.ForEachAsync(aInfoForSave, SaveAddress, cbError);
   /* }
    catch(e)
    {
        cbError(true);
    }*/

    function SaveAddress(aInfoForSave, nIndex, callbackErr)
    {
        console.log('SaveAddress start');
        //check - if address already present in database
        //const WHERE = "address='"+escape(aInfoForSave[nIndex].addr)+"' AND txin='"+aInfoForSave[nIndex].txin+"' AND number="+aInfoForSave[nIndex].n;
        const WHERE = "key='"+escape(aInfoForSave[nIndex].key)+"'";
        g_constants.dbTables['Address'].selectAll("number", WHERE, "LIMIT 1", function(error, rows) {
            console.log('SaveAddress select number from Address return');
            if (error || !rows)
            {
                //if database error then try again after 10 sec
                callbackErr(true);
                return;
            }
            
            if (rows.length)
            {
                //if address found then process new address
                callbackErr(false);
                return;
            }
            
            g_constants.dbTables['Address'].insert2(
                aInfoForSave[nIndex].key,
                aInfoForSave[nIndex].addr || JSON.stringify(['???']),
                JSON.stringify(aInfoForSave[nIndex].scriptPubKey) || JSON.stringify([]),
                aInfoForSave[nIndex].value,
                aInfoForSave[nIndex].txin,
                "0",
                aInfoForSave[nIndex].time,
                aInfoForSave[nIndex].n,
                aInfoForSave[nIndex].height,
                "0",
                callbackErr
            );
        });
        
        return;
    }
}

function SaveInputs(aTXs, nIndex, cbError)
{
    console.log('SaveInputs start');
   // try
  //  {
        if (!aTXs || !aTXs.length || aTXs.length <= nIndex)
        {
            cbError(true);
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
                'parent' : aTXs[nIndex].txid,
                'time' : aTXs[nIndex].time || 0
            });
        }
     
        g_db.RunMemQueries(function(err) {
            if (err) throw 'unexpected error in address RunMemQueries';
            g_utils.ForEachAsync(aInfoForSave, UpdateAddress, cbError);
        });
    /*}
    catch(e)
    {
        cbError(true);
    }   */
    
    function UpdateAddress(aInfoForSave, nIndex, callbackErr)
    {
        console.log('UpdateAddress start');
        if (!aInfoForSave || aInfoForSave.length <= nIndex)
        {
            callbackErr(true);
            return;
        }
        
        //check if address present in database
        //const WHERE = "txin='"+aInfoForSave[nIndex].txid+"' AND number="+aInfoForSave[nIndex].vout;
        const WHERE = "key='"+aInfoForSave[nIndex].txid+(aInfoForSave[nIndex].vout || "0")+"'";
        g_constants.dbTables['Address'].selectAll("*", WHERE, "LIMIT 1", function(e, r) {
            console.log('UpdateAddress select * from Address return');
            if (e || !r)
            {
                //if database error then try again after 10 sec
                callbackErr(true);
                return;
            }
            
            if (!r.length)
            {
                throw 'ERROR UpdateAddress(): adress is not synced WHERE='+WHERE;
            }
            
            //check if addres already processed
            if (r[0].txout == aInfoForSave[nIndex].parent)
            {
                //if record found then process next transaction and address
                callbackErr(false);
                return;
                
            }
            const SET = "txout='"+aInfoForSave[nIndex].parent+"', outtime='"+aInfoForSave[nIndex].time+"'";
            g_constants.dbTables['Address'].update(SET, WHERE, callbackErr);
        });
    }
}

