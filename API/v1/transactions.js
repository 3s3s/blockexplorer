'use strict';

const g_rpc = require("../rpc");
const periodic = require("../periodic");
const g_constants = require('../../constants');
const g_utils = require('../../utils');
const bitcoin = require('multicoinjs-lib');
const g_addrAPI = require('./address');


exports.GetMempool = function(query, res)
{
    g_utils.WaitBlockSync(()=>{ 
        res.end( JSON.stringify({'status' : 'success', 'data' : periodic.GetMempoolTXs()}) );
    });
};

exports.GetLast = function(query, res)
{
    g_utils.WaitBlockSync(()=>{ 
        g_utils.GetLastUnSyncAddrTransactions(10, function(error, rows) {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
        });
    });
};

exports.GetTransaction = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }

    g_utils.WaitBlockSync(()=>{ 
        g_utils.GetTxByHash(query.hash, function(result) {
            res.end( JSON.stringify(result) );
        });
    });
};

exports.PushTransaction = function(body, res)
{
    if (!body || !body.hex)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead {"hex" : "TX_HASH"})'}) );
        return;
    }
    
    g_rpc.sendrawtransaction({'tx' : body.hex}, function (rpcRet) {
        res.end( JSON.stringify(rpcRet) );
    });
};

exports.PushTx = function(body, responce)
{
    const res = responce;
    if (!body || !body.inputs || !body.inputs.length || !body.outputs || !body.change || !body.fee)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead {fee: "TX_FEE", inputs" : [privkey], "outputs" : [{address : amount}], "change" : address}})'}) );
        return;
    }
    const networkCurrent = bitcoin.networks[g_constants.COIN];
    const address_for_change = body.change;
    const sendFee = g_utils.MakeFloat(body.fee);
   
    let dFullSentAmount = 0.0;
    for (var addrOut in body.outputs)
    {
        dFullSentAmount += g_utils.MakeFloat(body.outputs[addrOut]);
    }
    
    let inputs = {};
    let addresses = [];
    for (var i=0; i<body.inputs.length; i++)
    {
        const keyPair = bitcoin.ECPair.fromWIF(body.inputs[i], networkCurrent);
        addresses.push(keyPair.getAddress());
        
        inputs[keyPair.getAddress()] = body.inputs[i];
    }
    
    const outputs = body.outputs;
    
    console.log('call getUnspentTransactions');
    g_addrAPI.GetUnspentTransactionsByAddress(addresses.toString(), {end : function(dataSTR) {
        const data = JSON.parse(dataSTR);
        setTimeout(function(){
            if (!data || !data.status || data.status.localeCompare('success') != 0)
            {
                console.log("getUnspentTransaction failed data="+(data?JSON.stringify(data):"null"))
                res.end( JSON.stringify({'status' : false, 'message' : "Сan not find unspent transaction for this addresses. Please try again later."}) );
                return;
            }
            console.log("getUnspentTransactions success. data="+JSON.stringify(data));
    
            var new_transaction = new bitcoin.TransactionBuilder(networkCurrent);
            
            //Inputs
            var current_amount = 0.0;
            var aSignArray = [];
            
            var unspent = [].concat(data.data);
            for (var n=0; n<unspent.length; n++)
            {
                const element = unspent[n];
    
                console.log('element='+JSON.stringify(element));
               
                const keyPrivate = inputs[element.address];
                const keyPair = bitcoin.ECPair.fromWIF(keyPrivate, networkCurrent);
               
                for (var i=0; i<element.unspent.length; i++)
                {
                    new_transaction.addInput(element.unspent[i].tx, element.unspent[i].n);
    
                    aSignArray.push(keyPair);
    
                    current_amount += g_utils.MakeFloat(element.unspent[i].amount);
                    if (current_amount >= dFullSentAmount+sendFee)
                    {
                        //console.log("current_amount >= sendAmount+sendFee: " + current_amount + " >= " + sendAmount+sendFee);
                        break;
                    }
                }
                if (current_amount >= dFullSentAmount+sendFee)
                    break;
            }
            console.log('current_amount='+current_amount);
            
            if (current_amount < dFullSentAmount+sendFee)
            {
                res.end( JSON.stringify({'status' : false, 'message' : "Bad (too big) send amount!"}) );
                return;
            }
    
            //Output
            var fRealSendAmount = 0.0;
            for (var addr in outputs)
            {
                new_transaction.addOutput(addr, parseInt(parseFloat(outputs[addr])/0.00000001));
                fRealSendAmount += parseFloat(outputs[addr]);
            }
            
            fRealSendAmount = g_utils.MakeFloat(fRealSendAmount);
            
            if (fRealSendAmount > current_amount)
                fRealSendAmount = current_amount;
                
            const fChange = g_utils.MakeFloat(parseFloat(current_amount) - fRealSendAmount - parseFloat(sendFee));
            
            if (fChange > 1.e-10 && address_for_change.length)
                new_transaction.addOutput(address_for_change, parseInt(parseFloat(fChange)/0.00000001));
    
            //Sign
            for (var i=0; i<aSignArray.length; i++)
            {
                new_transaction.sign(i, aSignArray[i]);
            }
    
            exports.PushTransaction({hex : new_transaction.build().toHex()}, {end : function(dataRet) {
                const data = dataRet;
                setTimeout(function() {
                    res.end( JSON.stringify({'status' : 'success', 'message' : data}));    
                }, 1);
            }});
        }, 1);
    }});
};

exports.GetTransactionInfo = function(query, res)
{
    const aTXs = query.split(',');
    
    let retResult = [];
    
    g_utils.WaitBlockSync(()=>{ 
        g_rpc.getblockcount("", function(result) {
            if (result.status != 'success')
            {
                res.end( JSON.stringify({'status' : false, 'message' : 'rpc getblockcount failed'}) );
                return;
            }
            
            let ret = {lastblock : parseInt(result.data), txs : []};

            g_utils.ForEachSync(aTXs, SaveTX, function(){
                ret.txs = retResult;
                res.end( JSON.stringify(ret) ); 
            });
        });
    });
    
    function SaveTX(aTXs, nIndex, cbError)
    {
        g_utils.GetTxByHash(aTXs[nIndex], function(result) {
            if (result.status == 'success' && result.data)
            {
                for (var i=0; i<result.data.length; i++)
                    retResult.push(result.data[i]);
            }
            cbError(false);
        });
    }
};
