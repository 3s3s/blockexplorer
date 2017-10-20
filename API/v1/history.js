'use strict';

const g_constants = require('../../constants');
const g_utils = require('../../utils');

exports.GetDiff = function(query, res)
{
    g_constants.dbTables['Blocks'].selectAll("time, difficulty", "", "GROUP BY difficulty ORDER BY time", function(error, rows) {
        if (error || !rows || ! rows.length)
        {
            res.end(  JSON.stringify({'status' : false, 'message' : 'database error'})  );
            return;
        }
        
        const divider = rows.length < 1001 ? 1 : Math.round(rows.length / 1000);
        
        let ret = [];
        for (var i=0; i<rows.length; i++)
        {
            ret.push([rows[i].time*1000, Math.round(rows[i].difficulty)]);
            i += divider;
        }
            
        res.end(  JSON.stringify({'status' : true, 'data' : ret})  );
    });
    
}