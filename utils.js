'use strict';

const https = require('https');
const http = require('http');
const g_constants = require("./constants");


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

exports.ForEach = function(array, func, callback)
{
    if (!array || !array.length)
    {
        if (callback) callback();
        return;
    }
    
    Run(array, 0, func);
    
    function Run(array, nIndex, func)
    {
        func(array, nIndex, function(bRepeat, nTimeout) {
            if (bRepeat)
            {
               setTimeout(Run, nTimeout, array, nIndex, func);
               return;
            }
            
            if (nIndex+1 >= array.length)
            {
                if (callback) callback();
                return;
            }
            
            setTimeout(Run, nTimeout | 10, array, nIndex+1, func);
        });
    }
}