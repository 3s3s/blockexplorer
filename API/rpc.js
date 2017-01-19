'use strict';

const constants = require('../constants');
const utils = require('../utils');

const headers = {
    'Content-Type': 'text/plain', 
    'Authorization': 'Basic ' + new Buffer(constants.rpcUser + ':' + constants.rpcPassword).toString('base64')
}

function rpcPostJSON(strJSON, callback)
{
    utils.postString(constants.rpcHost, {'nPort' : constants.rpcPort, 'name' : constants.rpcProtocol}, "/", headers, strJSON, function(result)
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
};

exports.getblockcount = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }';
    
    rpcPostJSON(strJSON, callback);
};

exports.getblockhash = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockhash", "params": ['+query.nBlock+'] }';
    
    rpcPostJSON(strJSON, callback);
};

exports.getblock = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getblock", "params": ["'+query.hash+'"] }';
    
    rpcPostJSON(strJSON, callback);
};

exports.getrawmempool = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getrawmempool", "params": [] }';
    
    rpcPostJSON(strJSON, callback);
};

exports.getrawtransaction = function(query, callback)
{
    if (query.txid == "91a95e3f6b682a1c272a7a9b8c1c37d3e9502d3ecb5748224f131c9a27a615d3")
    {
        const ret = {status: 'success', message: "premained tx", data: "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff03510101ffffffff01000064a7b3b6e00d232102409a5d04eb951ee77ed204a71108690a78456a37447455b34659a1138333d7dfac00000000"};
        callback(ret);
        return;
    }

    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "getrawtransaction", "params": ["'+query.txid+'"] }';
    
    rpcPostJSON(strJSON, callback);
};

exports.decoderawtransaction = function(query, callback)
{
    const strJSON = '{"jsonrpc": "1.0", "id":"curltest", "method": "decoderawtransaction", "params": ["'+query.tx+'"] }';
    
    rpcPostJSON(strJSON, callback);
};