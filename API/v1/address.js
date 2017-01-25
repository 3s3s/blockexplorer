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
    
    try
    {
        var strQueryAddr = "address='";
        var strQueryTx = "";
        for (var i=0; i<aAddr.length; i++)
        {
            mapAddrToTransactions[aAddr[i]] = {'address' : aAddr[i], 'unconfirmed' : []};
            
            strQueryAddr += (escape(aAddr[i])+"'");
                
            if (i < aAddr.length -1 && i<= 400)
                strQueryAddr += " OR address='";
                
            if (i > 400)
                break;
        }
    
        const mempool = periodic.GetMempoolTXs();
        
        for (var i=0; i<mempool.length; i++)
        {
            //Get unconfirmed txs with '+' value for given address
            const aVout = mempool[i].vout;
            for (var k=0; k<aVout.length; k++)
            {
                for (var j=0; j<aVout[k].scriptPubKey.addresses.length; j++)
                {
                    if (mapAddrToTransactions[aVout[k].scriptPubKey.addresses[j]] == undefined) 
                        continue;
                    
                    mapAddrToTransactions[aVout[k].scriptPubKey.addresses[j]].unconfirmed.push({
                        'tx' : mempool[i].txid, 
                        'amount' : aVout[k].value,
                        'n' : aVout[k].n
                    });
                }
            }

            //Get unconfirmed txs with '-' value for given address (from prev transaction)
            const aVin = mempool[i].vin;
            for (var j=0; j<aVin.length; j++)
            {
                if (aVin[j].txid == undefined || aVin[j].vout == undefined)
                    continue;
                    
                if (strQueryTx.length == 0)
                    strQueryTx = "txin='";
                else
                    strQueryTx += " OR txin='";
                    
                strQueryTx += escape(aVin[j].txid) + "'";
            }
        }
        
        const strWHERE = "(" + strQueryAddr + ")" + (strQueryTx.length == 0 ? "" : " AND (" + strQueryTx + ")");
        g_constants.dbTables['Address'].selectAll("*", strWHERE, "ORDER BY address", function(error, rows) {
            try
            {
                if (error || !rows)
                {
                    ReturnSuccess();
                    return;
                }
                
                for (var i=0; i<rows.length; i++)
                {
                    if (rows[i].txout == undefined) 
                        continue;
                        
                    mapAddrToTransactions[rows[i].address].unconfirmed.push({
                        'tx' : rows[i].txout, 
                        'amount' : '-' + rows[i].value,
                        'n' : rows[i].number
                    });
                }
                
                ReturnSuccess();
            }
            catch(e) {
                res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
            }
            
        });
    }
    catch(e) {
        res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
    }
    
    function ReturnSuccess()
    {
        var retArray = [];
        for(var data in mapAddrToTransactions)
            retArray.push(mapAddrToTransactions[data]);
    
        res.end( JSON.stringify({'status' : 'success', 'data' : retArray.length == 1 ? retArray[0] : retArray}) );
    }
};