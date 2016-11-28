'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');

var g_mempool = [];
exports.GetMempoolTXs = function() {return g_mempool};

var g_blockkount = 0;
exports.GetBlockCount = function() {return g_blockkount};

var g_nInitSyncFrom = 0;

exports.UpdateTransactions = function()
{
    g_rpc.getrawmempool('', function(rpcRet) {
        g_mempool = rpcRet;
    })
    
};

exports.UpdateBlocks = function()
{
    g_rpc.getblockcount('', function(rpcRet) {
        if (rpcRet.status != 'success')
            return;
        
        g_blockkount = rpcRet.data;
        
        g_constants.dbTables['Blocks'].selectAll("size", "", "", function(error, rows) {
            if (error)
                return;
            
            if (rows.length == g_blockkount)
                return;
            
            g_nInitSyncFrom = rows.length;
        });
    });
};

exports.Syncronize = function()
{
    if (g_nInitSyncFrom == g_blockkount) return;
    
    g_rpc.getblockhash({'nBlock' : g_nInitSyncFrom}, function (rpcRet) {
        if (rpcRet.status != 'success')
            return;
            
        g_utils.IsBlockExist(rpcRet.data, function(flag) {
            if (flag)
            {
                g_nInitSyncFrom++;
                return;
            }
            g_rpc.getblock({'hash' : rpcRet.data}, function(rpcRet2) {
                if (rpcRet2.status != 'success' || !rpcRet2.data.hash)
                    return;
                    
                g_constants.dbTables['Blocks'].insert(
                    rpcRet2.data.hash,
                    rpcRet2.data.size,
                    rpcRet2.data.height,
                    rpcRet2.data.version,
                    rpcRet2.data.merkleroot,
                    rpcRet2.data.time,
                    rpcRet2.data.nonce,
                    rpcRet2.data.bits,
                    rpcRet2.data.difficulty,
                    rpcRet2.data.previousblockhash || "",
                    rpcRet2.data.nextblockhash || "",
                    rpcRet2.data.ip || "",
                    rpcRet2.data.tx || ""
                );
            });
        }); 
    });
    
};