'use strict';

const periodic = require("../periodic");
const g_constants = require('../../constants');


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
}