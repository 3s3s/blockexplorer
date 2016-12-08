'use strict';

const https = require('https');
const http = require('http');
const g_constants = require("./constants");
const g_db = require("./API/database");


exports.getJSON = function(query, callback)
{
	return http.get(query, function(response) {
		var body = '';
		response.on('data', function(chunk) {
			body += chunk;
		});
		response.on('end', function()
		{
		    try {
        		callback(JSON.parse(body));
		    }
		    catch(e) {
		        console.log(e.message);
		    }
		});
	});
};

exports.postString = function(host, port, path, headers, strBody, callback) 
{
    const options = { 
        hostname: host, 
        port: port, 
        path: path, 
        method: 'POST', 
        headers: headers
    }; 
    
    var proto = (port == 443) ? https : http;
        
    var req = proto.request(options, function(res) { 
        console.log('Status: ' + res.statusCode); 
        console.log('Headers: ' + JSON.stringify(res.headers)); 
        
        res.setEncoding('utf8'); 
        
		var res_data = '';
		res.on('data', function (chunk) {
			res_data += chunk;
		});
		res.on('end', function() {
			callback({'success': 'success', 'data': res_data});
		});	
    }); 
    
    req.on('error', function(e) { 
        console.log('problem with request: ' + e.message); 
        callback({'success': false, message: 'problem with request: ' + e.message});
    }); 
    
    // write data to request body 
    req.end(strBody);    
};

exports.IsBlockExist = function(strHash, callback)
{
    g_constants.dbTables['Blocks'].selectAll("size", "hash='"+strHash+"'", "", function(error, rows) {
        callback (!error && rows.length);
    });
};

exports.GetBlockByHeight = function(nHeight, callback)
{
    g_constants.dbTables['Blocks'].selectAll("*", "height="+nHeight, "", function(error, rows) {
        callback (error, rows);
    });
};

exports.GetBlockTransactions = function(hash, callback)
{
    g_constants.dbTables['Transactions'].selectAll("*", "block='"+hash+"'", "ORDER BY txid", function(error, rows) {
        callback (error, rows);
    });
};

exports.GetLastUnSyncAddrTransactions = function(limit, callback)
{
    try
    {
        //find address with max time
        g_constants.dbTables['Address'].selectAll("*", "", "ORDER BY time DESC LIMIT 1", function(error, rows) {
            if (error || !rows)
            {
                callback(error, rows);
                return;
            }
            
            //find transactions with time >= max address time
            const strWhere = rows.length ? "time >= " + escape(rows[0].time) : "";
            g_constants.dbTables['Transactions'].selectAll("*", strWhere, "LIMIT "+limit, callback);
        });
    }
    catch(e)
    {
        callback({'message' : 'unexpected error in utils GetLastUnSyncAddrTransactions'}, []);
    }
    
};
exports.ForEach = function(array, func, callback, tick)
{
    if (!array || !array.length)
    {
        if (callback) callback();
        return;
    }
    for (var i=0; i<array.length; i++)
    {
        const nIndex = i;
        const endCallback = function(bRepeat, nTimeout){
            if (bRepeat) 
            {
                //throw 'ForEach: unexpected error';
                setTimeout(func, nTimeout || 1000, array, nIndex, endCallback);
                return;
            }
            if (tick) 
                tick(array, nIndex, function(bRepeatTick, nTimeoutTick) {tickCallback(bRepeatTick, nIndex);});  
            else
                tickCallback(false, nIndex);
        };
        func(array, nIndex, endCallback);
    }
    
    function tickCallback(bRepeatTick, nIndex)
    {
        if (bRepeatTick) throw 'tickCallback: unexpected error';
        if (nIndex+1 == array.length)
            callback();
    }
    
    return;
}
