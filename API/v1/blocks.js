'use strict';

const g_constants = require('../../constants');


exports.GetBlocks = function(query, res)
{
    g_constants.dbTables['Blocks'].selectAll("*", "", "ORDER BY height DESC LIMIT 10", function(error, rows) {
        if (error || !rows)
        {
            res.end( JSON.stringify({'status' : false, 'message' : error}) );
            return;
        }
        
        res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
    });
}

exports.GetBlock = function(query, res)
{
    g_constants.dbTables['Blocks'].selectAll("*", "hash='"+escape(query.hash)+"'", "", function(error, rows) {
        if (error || !rows || !rows.length)
        {
            res.end( JSON.stringify({'status' : false, 'message' : error}) );
            return;
        }
        
        res.end( JSON.stringify({'status' : 'success', 'data' : rows[0]}) );
    });
}