'use strict';

const constants = require('../constants');
const utils = require('../utils');
const periodic = require("./periodic");

const headers = {
    'Content-Type': 'text/plain', 
    'Authorization': 'Basic ' + new Buffer(constants.rpcUser + ':' + constants.rpcPassword).toString('base64')
}

exports.rpcPostJSON = function(strJSON, callback)
{
    console.log('rpcPostJSON ' + strJSON);
    utils.postString(constants.rpcHost, {'nPort' : constants.rpcPort, 'name' : constants.rpcProtocol}, "/", headers, strJSON, function(result)
    {
        if (result.data) {
            try {
                if (result.success)
                    result.data = JSON.parse(result.data);
                if (result.data.error && result.data.error.message)
                    result.message = result.data.error.message+"<br>";
                    
                if (!result.data.error && result.data.result != undefined)
                    result.data = result.data.result
                else
                    result.success = false; 
            }
            catch(e) {
                console.log('rpcPostJSON: '+e.message);
            }
        }
        else {
            result.success = false;
        }

        const ret = result.success ? 
                    {status: result.success, message: result.message || "", data: result.data || ""} :
                    {status: result.success, message: 0, data: result.message || ""};
        
        console.log('rpcPostJSON: ' + ret.status);
        callback(ret);
    });
    
}

exports.getinfo = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getinfo", "params": [] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.getblockcount0 = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }';
    
    exports.rpcPostJSON(strJSON, callback);
};
exports.getblockcount = function(query, callback)
{
    callback({status:'success', data:periodic.GetBlockCount()});
};

exports.getblockhash = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockhash", "params": ['+query.nBlock+'] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.getblock = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblock", "params": ["'+query.hash+'"] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.getrawmempool = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getrawmempool", "params": [] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.getrawtransaction = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getrawtransaction", "params": ["'+query.txid+'"] }';
    
    exports.rpcPostJSON(strJSON, callback);
};
exports.gettransaction = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "gettransaction", "params": ["'+query.txid+'"] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.decoderawtransaction = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "decoderawtransaction", "params": ["'+query.tx+'"] }';
    
    exports.rpcPostJSON(strJSON, callback);
};

exports.sendrawtransaction = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "sendrawtransaction", "params": ["'+query.tx+'"] }';
    
    exports.rpcPostJSON(strJSON, callback);
};