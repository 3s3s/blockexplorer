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
    
    g_constants.dbTables['Address'].selectAll("*", "address='"+escape(query.hash)+"'", "ORDER BY time DESC", function(error, rows) {
        try
        {
            if (error || !rows)
            {
                res.end( JSON.stringify({'status' : false, 'message' : error}) );
                return;
            }
            
            g_utils.ForEachSync(rows, SaveTransaction, function() {
                res.end( JSON.stringify({'status' : 'success', 'data' : rows}) );
            }/*, function(err, params, cbError){
                if (err || !params || params.nIndex >= 100)
                {
                    cbError(true);
                    return;
                }
                cbError(false);
            }*/);
        }
        catch(e)
        {
            res.end( JSON.stringify({'status' : false, 'message' : 'unexpected error'}) );
        }
    });
    
    function SaveTransaction(aAddress, nIndex, cbErr)
    {
        if (!aAddress || !aAddress.length)
        {
            cbErr(true);
            return;
        }
        
        if (nIndex > 100)
        {
            aAddress[nIndex]['txin_info'] = [];
            aAddress[nIndex]['txout_info'] = [];
            cbErr(false);
            return;
        }
        
        g_utils.GetTxByHash(aAddress[nIndex].txin, function(result) {
            if (!result.data)
            {
                cbErr(true);
                return;
            }
            aAddress[nIndex]['txin_info'] = result.data;
            if (!aAddress[nIndex].txout)
            {
                cbErr(false);
                return;
            }
            g_utils.GetTxByHash(aAddress[nIndex].txout, function(result2) {
                if (!result2.data)
                {
                    cbErr(false);
                    return;
                }
                aAddress[nIndex]['txout_info'] = result2.data;
                cbErr(false);
            });
        });
    }
}