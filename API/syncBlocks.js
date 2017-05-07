'use strict';

const g_rpc = require('./rpc');
const g_constants = require('../constants');
const g_utils = require('../utils');
const g_transactions = require("./syncTransaction");
const g_db = require("./database");

//var g_tmp = 16361;
exports.Sync = function()
{
    console.log('syncBlocks started');
  //  try
 //   {
        g_rpc.getblockcount('', function(rpcRet) {
            if (rpcRet.status != 'success' || !g_constants.dbTables['Blocks'])
            {
                setTimeout(exports.Sync, 10000);
                return;
            }
            
            //rpcRet.data = g_tmp++;
            //find last synced block by height
            g_constants.dbTables['Blocks'].selectAll("height", "", "ORDER BY height DESC LIMIT 1", function(error, rows) {
                if (error || !rows)
                {
                    //if database error then try again after 10 sec
                    setTimeout(exports.Sync, 10000);
                    return;
                }
                
                if (rows.length && rows[0].height == rpcRet.data)
                {
                    //if all synced then try again after 10 sec
                    g_utils.SetSyncState(true);
                    setTimeout(exports.Sync, 10000);
                    return;
                }
                
               // const heightStart = 0;// rows.length ? (rows[0].height) : 0;
                const heightStart = (rows.length && rows[0].height > 100) ? (rows[0].height-100) : 0;
                const heightEnd = rpcRet.data; //rpcRet.data - heightStart > 100 ? heightStart+100 : rpcRet.data;

                const aBlockNumbers = function() {
                    var ret = [];
                    for (var i=heightStart; i<=heightEnd; i++) ret.push(i);
                    return ret;
                } ();
                
                if (heightEnd - heightStart > 300)
                    g_utils.SetSyncState(true);
                else
                    g_utils.SetSyncState(false);
                
                DeleteTail(heightEnd);
                
                console.log('start from '+heightStart);
                g_utils.ForEachSync(aBlockNumbers, SaveBlock, function(){
                    //when all synced (or have error) then try again after 10 sec
//                    throw 'Block sync error 1';
                    g_utils.SetSyncState(true);
                    setTimeout(exports.Sync, 10000);
                }, function(err, params, cbError){
                    //when one function return
                    if (err)  throw 'Block sync error 2';

                    g_transactions.SaveTxFromBlock(params, function (err) {
                        if (err) throw 'unexpected SaveTxFromBlock( error';
                        g_db.RunMemQueries(cbError);
                    });
                });
            });
        });
   /* }
    catch(e)
    {
        throw 'unexpected Block Sync error';
        setTimeout(exports.Sync, 30000);
    }*/
};

function DeleteTail(heightEnd)
{
    const heightStart = heightEnd > 10 ? heightEnd-10 : heightEnd;
    
    g_constants.dbTables['Blocks'].delete("height > " + heightStart);
    g_constants.dbTables['Transactions'].delete("blockHeight > " + heightStart);
    g_constants.dbTables['Address'].delete("height > " + heightStart);
}

function SaveBlock(aBlockNumbers, nIndex, cbError)
{
    console.log('SaveBlock start');
    if (!aBlockNumbers || !aBlockNumbers.length || aBlockNumbers.length <= nIndex)
    {
        cbError(true);
        return;
    }
    
    const WHERE = "height="+aBlockNumbers[nIndex]; 
    //const OFFSET = ''; //'OFFSET ' + 0;//(parseInt(aBlockNumbers[nIndex]) > 0 ? parseInt(aBlockNumbers[nIndex])-1 : 0);
    //console.log('SaveBlock start select * from Blocks where '+WHERE);
    //g_constants.dbTables['Blocks'].selectAll("*", WHERE, "LIMIT 1 "+OFFSET, function(error, rows) {
    /*    console.log('SaveBlock select * return '+(error && error.message ? error.message : ""));
        if (error)
        {
            //if database error - wait 10 sec and try again
            cbError(true);
            return;
        }
            
        if (rows.length && rows[0].nextblockhash.length)
        {
            //if block found in database - return for process new block
            console.log('block #'+aBlockNumbers[nIndex]+' alredy in db');
            cbError(false, rows[0]);
            return;
        }*/
            
        //if block not found in database then call rpc to get block hash
        g_rpc.getblockhash({'nBlock' : aBlockNumbers[nIndex]}, function (rpcRet) {
            console.log('SaveBlock g_rpc.getblockhash return');
            if (rpcRet.status != 'success')
            {
                //if rpc error then wait 10 sec and try again
                cbError(true);
                return;
            }
                
            //call rpc to get full block info
            g_rpc.getblock({'hash' : rpcRet.data}, function(rpcRet2) {
                console.log('SaveBlock g_rpc.getblock return');
                if (rpcRet2.status != 'success' || !rpcRet2.data.hash)
                {
                    //if rpc error then wait 10 sec and try again
                    cbError(true);
                    return;
                }
                    
                const arrayTX = (typeof rpcRet2.data.tx === 'string') ? [].push(rpcRet2.data.tx) : rpcRet2.data.tx;
                
                rpcRet2.data.tx = JSON.stringify(arrayTX) || "[]";
               
                const block = {
                        hash: rpcRet2.data.hash,
                        size: rpcRet2.data.size,
                        height: rpcRet2.data.height,
                        version: rpcRet2.data.version,
                        merkleroot: rpcRet2.data.merkleroot,
                        time: rpcRet2.data.time,
                        nonce: rpcRet2.data.nonce,
                        bits: rpcRet2.data.bits,
                        difficulty: rpcRet2.data.difficulty,
                        previousblockhash: rpcRet2.data.previousblockhash || "",
                        nextblockhash: rpcRet2.data.nextblockhash || "",
                        ip: rpcRet2.data.ip || "",
                        tx: rpcRet2.data.tx,
                };
                //if (!rows.length)   
                //{
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
                        rpcRet2.data.tx,
                        function(err) {
                            console.log('SaveBlock insert2 return');
                            if (err) 
                            {
                                if (err.errno != 19) throw 'unexpected block insert error';
                                if (block.nextblockhash.length)
                                {
                                    //if block found in database - return for process new block
                                    console.log('block #'+rpcRet2.data.height+' alredy in db');
                                    cbError(false, block);
                                    return;
                                }
                                else
                                {
                                    const SET = "nextblockhash='"+rpcRet2.data.nextblockhash+"'";
                                    g_constants.dbTables['Blocks'].update(SET, WHERE, function(err) {
                                        console.log('SaveBlock update return');
                                        if (err) throw 'unexpected block update error';
                                        cbError(false, rpcRet2.data); 
                                    });
                                }
                            }
                            cbError(false, rpcRet2.data);
                        }
                    );
                //}
                /*else
                {
                    const SET = "nextblockhash='"+rpcRet2.data.nextblockhash+"'";
                    g_constants.dbTables['Blocks'].update(SET, WHERE, function(err) {
                        console.log('SaveBlock update return');
                        if (err) throw 'unexpected block update error';
                        cbError(false, rpcRet2.data); 
                    });
                }*/
            });
        });
    //});
}
