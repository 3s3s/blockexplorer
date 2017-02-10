'use strict';

const g_rpc = require("../rpc");
const g_constants = require('../../constants');
const g_utils = require('../../utils');
const periodic = require("../periodic");

function ReturnSuccess(mapAddrTo, res)
{
    var retArray = [];
    for(var data in mapAddrTo)
        retArray.push(mapAddrTo[data]);
    
    res.end( JSON.stringify({'status' : 'success', 'data' : retArray.length == 1 ? retArray[0] : retArray}) );
}

function SaveTransaction(aAddress, nIndex, cbErr)
{
    if (!aAddress || !aAddress.length)
    {
        cbErr(true);
        return;
    }
        
    if (nIndex > 400)
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

exports.GetAddress = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }
    
    g_constants.dbTables['Address'].selectAll("*", "address='"+escape(query.hash)+"'", "ORDER BY height DESC LIMIT 400", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            
            g_utils.ForEachSync(rows, SaveTransaction, function() {
                res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
            });
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
    });
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
            
        mapAddrToBalance[aAddr[i]] = {'address' : aAddr[i], 'balance' : 0};
            
        if (i > 400)
            break;
    }

    g_constants.dbTables['Address'].selectAll("*", "(" + strQueryAddr + ") AND txout = '0'", "", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            
            for (var i=0; i<rows.length; i++)
                mapAddrToBalance[rows[i].address].balance += parseFloat(rows[i].value);

            ReturnSuccess(mapAddrToBalance, res);
        }
        catch(e) {
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

        g_constants.dbTables['Address'].selectAll("*", strQueryAddr, "LIMIT 400", function(error, rows) {
            try
            {
                if (error || !rows)
                {
                    res.end( JSON.stringify({'status' : false, 'message' : error}) );
                    return;
                }
                
                g_utils.ForEachSync(rows, SaveTransaction, function() {
                    for (var i=0; i<rows.length; i++)
                    {
                        const isoTime = (rows[i].time+'').indexOf('-') == -1 ? new Date(rows[i].time*1000).toISOString() : rows[i].time;
                        mapAddrToTransactions[rows[i].address].nb_txs++;
                        mapAddrToTransactions[rows[i].address].txs.push(
                            {'tx' : rows[i].txin, 'time_utc' : isoTime, 'confirmations' : (parseInt(nBlockCount)+1)-rows[i].height, 'amount' : rows[i].value});
                            
                        if (rows[i].txout_info && rows[i].txout_info.length && rows[i].txout == rows[i].txout_info[0].txid)
                        {
                            const isoTime = (rows[i].txout_info[0].time+'').indexOf('-') == -1 ? new Date(rows[i].txout_info[0].time*1000).toISOString() : rows[i].txout_info[0].time;
                            mapAddrToTransactions[rows[i].address].nb_txs++;
                            mapAddrToTransactions[rows[i].address].txs.push(
                                {'tx' : rows[i].txout, 'time_utc' : isoTime, 'confirmations' : (parseInt(nBlockCount)+1)-rows[i].txout_info[0].blockHeight, 'amount' : '-'+rows[i].value});
                        }
                    }
                    ReturnSuccess(mapAddrToTransactions, res);
                });
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
            
            strQueryAddr += escape(aAddr[i])+"'";
                
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
                        'n' : aVout[k].n,
                        'time_utc' : aVout[k].time || new Date().toISOString()
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
        if (strQueryTx.length == 0)
        {
            ReturnSuccess(mapAddrToTransactions, res);
            return;
        }
        
        const strWHERE = "(" + strQueryAddr + ")" + " AND (" + strQueryTx + ") AND txout='0'";
        g_constants.dbTables['Address'].selectAll("*", strWHERE, " LIMIT 400", function(error, rows) {
            try
            {
                if (error || !rows)
                {
                    ReturnSuccess(mapAddrToTransactions, res);
                    return;
                }
                
                for (var i=0; i<rows.length; i++)
                {
                    if (rows[i].txout == undefined) 
                        continue;
                        
                    mapAddrToTransactions[rows[i].address].unconfirmed.push({
                        'tx' : rows[i].txin, 
                        'amount' : '-' + rows[i].value,
                        'n' : rows[i].number,
                        'time_utc' : rows[i].time
                    });
                }
                
                ReturnSuccess(mapAddrToTransactions, res);
            }
            catch(e) {
                res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
            }
            
        });
    }
    catch(e) {
        res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
    }
};

exports.GetUnspentTransactionsByAddress = function(query, res)
{
    const aAddr = query.split(',');
    
    var mapAddrToTransactions = {};
    
    try
    {
        var strQueryAddr = "address='";
        for (var i=0; i<aAddr.length; i++)
        {
            mapAddrToTransactions[aAddr[i]] = {'address' : aAddr[i], 'unspent' : []};
            
            strQueryAddr += escape(aAddr[i])+"'";
                
            if (i < aAddr.length -1 && i<= 400)
                strQueryAddr += " OR address='";
                
            if (i > 400)
                break;
        }
        
        if (!aAddr.length)
        {
            ReturnSuccess(mapAddrToTransactions, res);
            return;
        }
        
        g_rpc.getblockcount("", function(result) {
            if (result.status != 'success')
            {
                res.end( JSON.stringify({'status' : false, 'message' : 'rpc getblockcount failed'}) );
                return;
            }
            
            const nBlockCount = parseInt(result.data);
            
            g_constants.dbTables['Address'].selectAll("*", "(" + strQueryAddr + ")" + " AND (txout='0' AND value<>'0')", " LIMIT 400", function(error, rows) {
                try
                {
                    if (error || !rows)
                    {
                        ReturnSuccess(mapAddrToTransactions, res);
                        return;
                    }
                    
                    for (var i=0; i<rows.length; i++)
                    {
                        if (rows[i].txin == undefined) 
                            continue;
                            
                        mapAddrToTransactions[rows[i].address].unspent.push({
                            'tx' : rows[i].txin, 
                            'amount' : rows[i].value,
                            'n' : rows[i].number,
                            'confirmations' : nBlockCount + 1 - parseInt(rows[i].height)
                        });
                    }
                    
                    ReturnSuccess(mapAddrToTransactions, res);
                }
                catch(e) {
                    res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
                }
            });

        });
    }
    catch(e) {
        res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
    }
}