'use strict';

const $ = require('jquery');
const g_utils = require("./utils");
const g_txs = require("./transactions");

exports.ShowBlock = function(hash, callbackErr)
{
  var query = "hash="+hash;
  //var path = "hash/"+hash;
  if (!isNaN(hash)) //block number
  {
    query = "height="+hash;
    //path = "height/"+hash;
  }

    $.getJSON( "/api/v1/getblock?"+query, function(data) {
    //$.getJSON( "/block"+path, function(data) {
      if (data.status == 'success' && (data.data instanceof Object))
      {
        g_utils.HideAll();
        
        $('#block_page').empty().append(
          $(g_utils.Header("Block #"+data.data.height)),
          $("<div class='row'></div>").append(
            $(g_utils.LeftTable(6, "block_table", "Summary", " ")),
            $(g_utils.LeftTable(6, "block_hashes_table", "Hashes", " "))),
          $(g_utils.Header("Transactions  ", "", 'h2')),
          $("<div class='row-fluid'></div>").append(
            $(g_utils.LeftTable(12, "block_tx_table")))
          ).show();
//          $("<div class='row-fluid'></div>").append(
//            $(g_utils.LeftTable(12, "block_tx_table", "Transactions", " ")))
          //$(g_utils.Header("Transactions  ", "", 'h2'))//,
          /*$("<div class='row-fluid'></div>").append(
               $(g_utils.LeftTable(12, "block_tx_table"))*/
          //)
         //.show();
        
        $('#block_table').append(
          $("<tr></tr>").append("<td>"+"Number Of Transactions"+"</td>"+"<td>"+data.data.tx.length+"</td>"),
          $("<tr></tr>").append("<td>"+"Height"+"</td>"+"<td>"+data.data.height+"</td>"),
          $("<tr></tr>").append("<td>"+"Timestamp"+"</td>"+"<td>"+(new Date(unescape(data.data.time)*1000)).toUTCString()+"</td>"),
          $("<tr></tr>").append("<td>"+"Difficulty"+"</td>"+"<td>"+data.data.difficulty+"</td>"),
          $("<tr></tr>").append("<td>"+"Bits"+"</td>"+"<td>"+data.data.bits+"</td>"),
          $("<tr></tr>").append("<td>"+"Size"+"</td>"+"<td>"+data.data.size+"</td>"),
          $("<tr></tr>").append("<td>"+"Nonce"+"</td>"+"<td>"+data.data.nonce+"</td>")
          );

        //const blkHash = CreateBlockHash(data.data.hash);
        $('#block_hashes_table').append(
          $("<tr></tr>").append($("<td>"+"Hash"+"</td>"), $("<td></td>").append(exports.CreateBlockHash(data.data.hash))),
          $("<tr></tr>").append($("<td>"+"Previous Block"+"</td>"), $("<td></td>").append(exports.CreateBlockHash(data.data.previousblockhash))),
          $("<tr></tr>").append($("<td>"+"Next Block(s)"+"</td>"), $("<td></td>").append(exports.CreateBlockHash(data.data.nextblockhash))),
          $("<tr></tr>").append("<td>"+"Merkle Root"+"</td>"+"<td>"+data.data.merkleroot+"</td>")
          );
          
        const txs = data.data.tx;
        
        for (var i=0; i<txs.length; i++)
        {
          var table = $('#block_tx_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(txs[i].txid)), $("<td></td><td></td>")));
          if (txs[i].tx_info && txs[i].tx_info.length > 0)
          {
            const vout = JSON.parse(unescape(txs[i].tx_info[0].vout));
            g_txs.ShowTransactionInfo(txs[i].txid, txs[i].tx_info[0].vin, vout, '#block_tx_table');
          }
        }
        
        if (callbackErr) callbackErr(false);
      }
      else
      {
        if (callbackErr) callbackErr(true);
      }
    })
    .fail(function() {
//      alert( "error" );
      if (callbackErr) callbackErr(true);
    });
};

exports.CreateBlockHash = function(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="/block/'+hash+'">'+hash+'</a></td>');  
  /*ret[0].onclick = function()
  {
    exports.ShowBlock($(this).attr('hash'));
  };*/
  return ret;
};