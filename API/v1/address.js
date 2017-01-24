'use strict';

const g_rpc = require("../rpc");
const g_constants = require('../../constants');
const g_utils = require('../../utils');
const periodic = require("../periodic");

exports.GetAddress = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }
    
    g_constants.dbTables['Address'].selectAll("*", "address='"+escape(query.hash)+"'", "ORDER BY time DESC", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            
            g_utils.ForEachSync(rows, SaveTransaction, function() {
                res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
            }/*, function(err, params, cbError){
                if (err || !params || params.nIndex >= 100)
                {
                    cbError(true);
                    return;
                }
                cbError(false);
            }*/);
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
    });
    
    function SaveTransaction(aAddress, nIndex, cbErr)
    {
        if (!aAddress || !aAddress.length)
        {
            cbErr(true);
            return;
        }
        
        if (nIndex > 100)
        {
            aAddress[nIndex]['txin_info'] = [];
            aAddress[nIndex]['txout_info'] = [];
            cbErr(false);
            return;
        }
        
        g_utils.GetTxByHash(aAddress[nIndex].txin, function(result) {
            if (!result.data)
            {
                cbErr(true);
                return;
            }
            aAddress[nIndex]['txin_info'] = result.data;
            if (!aAddress[nIndex].txout)
            {
                cbErr(false);
                return;
            }
            g_utils.GetTxByHash(aAddress[nIndex].txout, function(result2) {
                if (!result2.data)
                {
                    cbErr(false);
                    return;
                }
                aAddress[nIndex]['txout_info'] = result2.data;
                cbErr(false);
            });
        });
    }
};

exports.GetAddressBalance = function(query, res)
{
    const aAddr = query.split(',');
    
    var mapAddrToBalance = {};
    
    var strQueryAddr = "address='";
    for (var i=0; i<aAddr.length; i++)
    {
        strQueryAddr += escape(aAddr[i]) + "'";
        if (i < aAddr.length -1 && i<= 400)
            strQueryAddr += " OR address='";
            
        mapAddrToBalance[aAddr[i]] = 0;
        
        if (i > 400)
            break;
    }

    g_constants.dbTables['Address'].selectAll("*", strQueryAddr, "ORDER BY address", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            
            for (var i=0; i<rows.length; i++)
            {
                if (rows[i].txout == '0')
                    mapAddrToBalance[rows[i].address] = parseFloat(mapAddrToBalance[rows[i].address] || 0) + parseFloat(rows[i].value);
            }
            
            var retArray = [];
            for(var address in mapAddrToBalance)
                retArray.push({"address" : address, "balance" : mapAddrToBalance[address]});

            res.end( JSON.stringify({'status' : 'success', 'data' : retArray.length == 1 ? retArray[0] : retArray}) );
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
        
    });
};

exports.GetTransactionsByAddress = function(query, res)
{
    const aAddr = query.split(',');
    
    var mapAddrToTransactions = {};
    
    var strQueryAddr = "address='";
    for (var i=0; i<aAddr.length; i++)
    {
        strQueryAddr += escape(aAddr[i]) + "'";
        if (i < aAddr.length -1 && i<= 400)
            strQueryAddr += " OR address='";
            
        mapAddrToTransactions[aAddr[i]] = {'address' : aAddr[i], 'nb_txs' : 0, 'txs' : []};
            
        if (i > 400)
            break;
    }

    g_rpc.getblockcount("", function(result) {
        if (result.status != 'success')
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'rpc getblockcount failed'}) );
            return;
        }
        
        const nBlockCount = parseInt(result.data);

        g_constants.dbTables['Address'].selectAll("*", strQueryAddr, "ORDER BY address", function(error, rows) {
            try
            {
                if (error || !rows)
                {
                    res.end( JSON.stringify({'status' : false, 'message' : error}) );
                    return;
                }
                
                for (var i=0; i<rows.length; i++)
                {
                    mapAddrToTransactions[rows[i].address].nb_txs++;
                    mapAddrToTransactions[rows[i].address].txs.push(
                        {'tx' : rows[i].txin, 'time_utc' : rows[i].time, 'confirmations' : (parseInt(nBlockCount)+1)-rows[i].height, 'amount' : rows[i].value});
                    
                    if (rows[i].txout.length > 2)
                    {
                        mapAddrToTransactions[rows[i].address].txs.push(
                            {'tx' : rows[i].txout, 'time_utc' : rows[i].time, 'confirmations' : (parseInt(nBlockCount)+1)-rows[i].height, 'amount' : '-'+rows[i].value});
                    }
                }
                
                var retArray = [];
                for(var data in mapAddrToTransactions)
                    retArray.push(mapAddrToTransactions[data]);
    
                res.end( JSON.stringify({'status' : 'success', 'data' : retArray.length == 1 ? retArray[0] : retArray}) );
            }
            catch(e)
            {
                res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
            }
            
        });
    });
};

exports.GetUnconfirmedTransactionsByAddress = function(query, res)
{
    const aAddr = query.split(',');
    
    var mapAddrToTransactions = {};
    
    var strQueryAddr = "address='";
    for (var i=0; i<aAddr.length; i++)
    {
        strQueryAddr += escape(aAddr[i]) + "'";
        if (i < aAddr.length -1 && i<= 400)
            strQueryAddr += " OR address='";
            
        mapAddrToTransactions[aAddr[i]] = {'address' : aAddr[i], 'unconfirmed' : []};
            
        if (i > 400)
            break;
    }

    const mempool = periodic.GetMempoolTXs();
    for (var i=0; i<mempool.length; i++)
    {
        const aVout = JSON.parse(unescape(mempool[i].vout));
        for (var j=0; j<aVout[i].scriptPubKey.addresses.length; j++)
        {
            if (mapAddrToTransactions[aVout[i].scriptPubKey.addresses[j]] == undefined) 
                continue;
            
            mapAddrToTransactions[aVout[i].scriptPubKey.addresses[j]].unconfirmed.push({
                'tx' : mempool[i].txid, 
                'amount' : aVout[i].value,
                'n' : aVout[i].n
            });
        }
        
        const aVin = JSON.parse(unescape(mempool[i].vin));
        for (var j=0; j<aVin[i].length; j++)
        {
            if (aVin[i].txid == undefined || aVin[i].vout == undefined)
                continue;
            
            const n = aVin[i].vout;    
            g_utils.GetTxByHash(aVin[i].txid, function(result) {
                if (result.status == false || result.data[0] == undefined || result.data[0].scriptPubKey == undefined || result.data[0].scriptPubKey.addresses == undefined)
                    return;
                    
                if (result.data[0].scriptPubKey.addresses[n] == undefined)
                    return;
                    
                if (mapAddrToTransactions[result.data[0].scriptPubKey.addresses[n]] == undefined) 
                    return;
                    
                mapAddrToTransactions[aVout[i].scriptPubKey.addresses[j]].unconfirmed.push({
                    'tx' : aVin[i].txid, 
                    'amount' : '-' + aVin[i].value,
                    'n' : n
                })
            });
        }
    }
};