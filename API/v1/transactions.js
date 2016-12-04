'use strict';

const periodic = require("../periodic");
const g_constants = require('../../constants');
const g_utils = require('../../utils');


exports.GetMempool = function(query, res)
{
    res.end( JSON.stringify({'status' : 'success', 'data' : periodic.GetMempoolTXs()}) );
};

exports.GetLast = function(query, res)
{
    g_constants.dbTables['Transactions'].selectAll("*", "", "ORDER BY blockHeight DESC LIMIT 10", function(error, rows) {
        if (error || !rows)
        {
            res.end( JSON.stringify({'status' : false, 'message' : error}) );
            return;
        }
        res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
    });
};

exports.GetTransaction = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }
    g_constants.dbTables['Transactions'].selectAll("*", "txid='"+escape(query.hash)+"'", "", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            if (rows.length != 1)
            {
                res.end( JSON.stringify({'status' : false, 'message' : 'unexpected return from database'}) );
                return;
            }
            
            var vin = JSON.parse(unescape(rows[0].vin));
            if (vin && vin.length)
            {
                g_utils.ForEach(vin, SaveInput, function() {
                    rows[0].vin = vin;
                    res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
                });
            }
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
    });
};

function SaveInput(aVIN, nIndex, callback)
{
    if (aVIN[nIndex].coinbase)
    {
        aVIN[nIndex].addr = [];
        callback(false);
        return;
    }
    g_constants.dbTables['Address'].selectAll("*", "txout='"+escape(aVIN[nIndex].txid)+"'", "", function(error, rows) {
        aVIN[nIndex].addr = rows;
        callback(false);
    });
}