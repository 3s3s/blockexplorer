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
    if (!query.hash && !query.height)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=... or ?height=)'}) );
        return;
    }
    
    const WHERE = query.hash && isNaN(query.hash) ? "hash='"+escape(query.hash)+"'" : "height="+(escape(query.height) || 0);
    
    g_constants.dbTables['Blocks'].selectAll("*", WHERE, "", function(error, rows) {
        if (error || !rows || !rows.length)
        {
            res.end( JSON.stringify({'status' : false, 'message' : error}) );
            return;
        }
        
        res.end( JSON.stringify({'status' : 'success', 'data' : rows[0]}) );
    });
}