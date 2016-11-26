'use strict';

const constants = require('../constants');
const utils = require('../utils');

const headers = {
    'Content-Type': 'text/plain', 
    'Authorization': 'Basic ' + new Buffer(constants.rpcUser + ':' + constants.rpcPassword).toString('base64')
}

function rpcPostJSON(strJSON, callback)
{
    utils.postString(constants.rpcHost, constants.rpcPort, "/", headers, strJSON, function(result)
    {
        if (result.data) {
            try {
                if (result.success)
                    result.data = JSON.parse(result.data);
                if (result.data.error && result.data.error.message)
                    result.message = result.data.error.message+"<br>";
                    
                if (result.data.result)
                    result.data = result.data.result
                else
                    result.success = false; 
            }
            catch(e) {}
        }
        else {
            result.success = false;
        }

        const ret = result.success ? 
                    {status: result.success, message: result.message || "", data: result.data || ""} :
                    {status: result.success, message: 0, data: result.message || ""};
        
        callback(ret);
    });
    
}

exports.getinfo = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getinfo", "params": [] }';
    
    rpcPostJSON(strJSON, callback);
}

exports.getblockcount = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }';
    
    rpcPostJSON(strJSON, callback);
}

exports.getblockhash = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockhash", "params": ['+query.nBlock+'] }';
    
    rpcPostJSON(strJSON, callback);
}