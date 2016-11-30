'use strict';

const g_constants = require('../../constants');


exports.GetBlocks = function(query, res)
{
    g_constants.dbTables['Blocks'].selectAll("*", "", "ORDER BY height DESC LIMIT 10", function(error, rows) {
        if (error)
        {
            res.end( JSON.stringify({'status' : false, 'message' : error}) );
            return;
        }
        
        res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
    });
}