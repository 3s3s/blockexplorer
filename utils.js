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

exports.ForEachAsync = function(array, func, cbEndAll)
{
    if (!array || !array.length)
    {
        console.log('success: ForEachAsync (!array || !array.length)');
        cbEndAll(false);
        return;
    }
    
    let nEndCounter = 0;
    
    for (var i=0; i<array.length; i++)
    {
        func(array, i, onEndOne);
    }
    
    function onEndOne(err)
    {
        if (err)
        {
           //if func return error, then stop and return from 'ForEachSync'
            console.log('error: ForEachSync_Run_cbEndOne return error');
            cbEndAll(true);
            return;
        }
        nEndCounter++;
        if (nEndCounter >= array.length)
        {
            console.log('success: ForEachAsync all return ok');
            cbEndAll(false);
            return;
        }
    }
};

exports.ForEachSync = function(array, func, cbEndAll, cbEndOne)
{
    if (!array || !array.length)
    {
        console.log('success: ForEachAsync (!array || !array.length)');
        cbEndAll(false);
        return;
    }
    
    Run(0);
    
    function Run(nIndex)
    {
        if (nIndex >= array.length) throw 'error: ForEachSync_Run (nIndex >= array.length)';
        func(array, nIndex, onEndOne);
        
        function onEndOne(err)
        {
            if (nIndex+1 >= array.length) {
                //if all processed then stop and return from 'ForEachSync'
                console.log('success: ForEachSync_Run_cbEndOne return all ok');
                cbEndAll(false);
                return;
            }
            
            cbEndOne(err, nIndex, function(error) {
                if (error) {
                    //if func return error, then stop and return from 'ForEachSync'
                    console.log('error: ForEachSync_Run_cbEndOne return error');
                    cbEndAll(true);
                    return;
                }
                Run(nIndex+1);
            });
        }
    }
};

/*exports.ForEach = function(array, func, callback, tick)
{
    if (tick) throw 'remove tick';
    
    if (!array || !array.length)
    {
        if (callback) callback(true);
        return;
    }
    for (var i=0; i<array.length; i++)
    {
        const nIndex = i;
        const endCallback = function(bError, nTimeout){
            if (nTimeout) throw 'ForEach: nead remove nTimeout';
            if (bError) 
            {
                //throw 'ForEach: unexpected error';
                //setTimeout(func, nTimeout || 1000, array, nIndex, endCallback);
                if (callback) callback(true);
                return;
            }
            /*if (tick) 
                tick(array, nIndex, function(bRepeatTick, nTimeoutTick) {tickCallback(bRepeatTick, nIndex);});  
            else
                tickCallback(false, nIndex);*/
/*        };
        func(array, nIndex, endCallback);
    }
    
    /*function tickCallback(bRepeatTick, nIndex)
    {
        if (bRepeatTick) 
        {
            //throw 'tickCallback: unexpected error';
            callback(true, 10);
            return;
        }
        
        if (nIndex+1 == array.length)
            callback(false);
    }*/
    
/*    return;
}*/
