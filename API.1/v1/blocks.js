'use strict';

const g_constants = require('../../constants');
const g_utils = require('../../utils');


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
        
        var txs = JSON.parse(unescape(rows[0].tx));
        let ret = rows[0];
       // rows[0].tx = JSON.parse(unescape(rows[0].tx));
        
        g_utils.ForEachSync(txs, SaveTransaction, function() {
            ret.tx = txs;
            res.end( JSON.stringify({'status' : 'success', 'data' : ret}) )});
//        res.end( JSON.stringify({'status' : 'success', 'data' : rows[0]}) );
    });
    
    function SaveTransaction(tx, nIndex, cbErr)
    {
        if (!tx || !tx.length)
        {
            cbErr(true);
            return;
        }
        
        g_utils.GetTxByHash(tx[nIndex], function(result) {
            if (!result.data)
            {
                cbErr(true);
                return;
            }
            tx[nIndex]={'txid' : tx[nIndex], 'tx_info' : result.data};//['tx_info'] = result.data;
            cbErr(false);
        });
        
    }
}