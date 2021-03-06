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
    g_utils.GetLastUnSyncAddrTransactions(10, function(error, rows) {
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

    g_utils.GetTxByHash(query.hash, function(result) {
        res.end( JSON.stringify(result) );
    });

};
