'use strict';

const periodic = require("../periodic");
const g_constants = require('../../constants');
const g_utils = require('../../utils');

exports.GetAddress = function(query, res)
{
    if (!query.hash)
    {
        res.end( JSON.stringify({'status' : false, 'message' : 'ERROR: bad query (nead ?hash=...)'}) );
        return;
    }
    g_constants.dbTables['Address'].selectAll("*", "address='"+escape(query.hash)+"'", "ORDER BY time", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }

            res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
    });
}