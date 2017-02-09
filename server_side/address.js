'use strict';

const $ = require('jquery');
const g_utils = require("./utils");
const g_txs = require("./transactions");

exports.ShowAddress = function(hash)
{
    $.getJSON( "/api/v1/getaddress?hash="+hash, function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        g_utils.HideAll();
        
        if (!data.data.length)
          return;
          
        const addr = data.data[0];

        $('#addr_page').empty().append(
          $(g_utils.Header("Address  ", "<small>Addresses are identifiers which you use to send bitcoins to another person</small>")),
 //         $("<div class='row-fluid'></div>").append(
 //           $(LeftTable(12, "addr_info_table", CreateAddrHash(unescape(data.data[0].address)), " ", " "))),
          $("<div class='row-fluid'></div>").append(
            $(g_utils.LeftTable(6, "addr_table", "Summary", " ")),
            $(g_utils.LeftTable(6, "addr_io_table", "Transactions", " "))),
          $(g_utils.Header("Transactions  ", "<small>(newest first)</small>", 'h2')),
          $("<div class='row-fluid'></div>").append(
             $(g_utils.LeftTable(12, "addr_inputs_table")))
          )
          .show();
       
        $('#addr_table').append(
          $("<tr></tr>").append($("<td>"+"Address"+"</td>"), $("<td></td>").append(exports.CreateAddrHash(unescape(data.data[0].address))))
          );
          
        var recieved = 0.0; 
        var balance = 0.0;
        for (var i=0; i<data.data.length; i++)
        {
          recieved += parseFloat(data.data[i].value);
          
          if (data.data[i].txout.length == 1)
            balance += parseFloat(data.data[i].value);
        }
        
        var txs = [];
        for (var i=0; i<data.data.length; i++)
        {
          if (data.data[i].txin.length > 1 && data.data[i].txin_info && data.data[i].txin_info.length)
            txs.push({'tx' : data.data[i].txin, 'info' : data.data[i].txin_info, 'vout' : data.data[i].txin_info[0].vout, 'status' : 'success'});
          if (data.data[i].txout.length > 1 && data.data[i].txout_info && data.data[i].txout_info.length)
            txs.push({'tx' : data.data[i].txout, 'info' : data.data[i].txout_info, 'vout' : data.data[i].txout_info[0].vout, 'status' : 'danger'});
        }
        
        txs.sort(function(tx1, tx2) {
          return (tx2.info[0].blockHeight - tx1.info[0].blockHeight);
        });
        
        for (var i=0; i<txs.length; i++)
        {
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(txs[i].tx))), $("<td></td><td></td>")));
            
            const vout = JSON.parse(unescape(txs[i].vout));
            g_txs.ShowTransactionInfo(txs[i].tx, txs[i].info[0].vin, vout, '#addr_inputs_table', txs[i].status);
        }
        
       /* for (var i=0; i<data.data.length; i++)
        {
          if (data.data[i].txin.length > 1)
          {
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(data.data[i].txin))), $("<td></td><td></td>")));
            if (data.data[i].txin_info && data.data[i].txin_info.length)
            {
              const vout = JSON.parse(unescape(data.data[i].txin_info[0].vout));
              g_txs.ShowTransactionInfo(data.data[i].txin, data.data[i].txin_info[0].vin, vout, '#addr_inputs_table', 'success');
            }
            nTxCount++;
          }
          if (data.data[i].txout.length > 1)
          {
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(data.data[i].txout))), $("<td></td><td></td>")));
            if (data.data[i].txout_info && data.data[i].txout_info.length)
            {
              const vout = JSON.parse(unescape(data.data[i].txout_info[0].vout));
              g_txs.ShowTransactionInfo(data.data[i].txin, data.data[i].txout_info[0].vin, vout, '#addr_inputs_table', "danger");
            }
            nTxCount++;
          }
          
          //g_utils.ShowTransactionInfo(tx.txid, vin, vout, 'txs_info_table');
        }*/

        $('#addr_io_table').append(
          $("<tr></tr>").append($("<td>"+"No. Transactions"+"</td>"), $("<td></td>").append(txs.length)),
          $("<tr></tr>").append($("<td>"+"Total Received"+"</td>"), $("<td></td>").append(recieved)),
          $("<tr></tr>").append($("<td>"+"Final Balance"+"</td>"), $("<td></td>").append(balance))
          );
      }
    });
    
};

exports.CreateAddrHash = function(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="/address/'+hash+'">'+hash+'</a></td>');  
  /*ret[0].onclick = function()
  {
    exports.ShowAddress($(this).attr('hash'));
  };*/
  return ret;
};