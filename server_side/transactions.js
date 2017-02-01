'use strict';

const $ = require('jquery');
const g_utils = require("./utils");
const g_addr = require("./address");

exports.ShowTransaction = function(hash)
{
    $.getJSON( "/api/v1/gettransaction?hash="+hash, function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        g_utils.HideAll();
        
        if (!data.data.length)
          return;
          
        const tx = data.data[0];

        $('#tx_page').empty().append(
          $(g_utils.Header("Transaction  ", "<small>View information about a bitcoin transaction</small>")),
          $("<div class='row-fluid'></div>").append(
            $(g_utils.LeftTable(12, "txs_info_table", exports.CreateTxHash(unescape(tx.txid)), " ", " "))),
          $("<div class='row-fluid'></div>").append(
            $(g_utils.LeftTable(6, "txs_table", "Summary", " ")),
            $(g_utils.LeftTable(6, "txs_io_table", "Inputs and Outputs", " "))),
          $("<div class='row-fluid'></div>").append(
             $(g_utils.LeftTable(12, "txs_inputs_table", "Input Scripts", " "))),
          $("<div class='row-fluid'></div>").append(
             $(g_utils.LeftTable(12, "txs_outputs_table", "Output Scripts", " ")))
          )
          .show();
          
        const vin = data.data[0].vin;
        const vout = JSON.parse(unescape(data.data[0].vout));
        
        const totalInput = exports.ShowTransactionInfo(tx.txid, vin, vout, '#txs_info_table', 'success');
        
        $('#txs_table').append(
          $("<tr></tr>").append($("<td>"+"Received Time"+"</td>"), $("<td></td>").append(g_utils.UTC(tx.time))),
          $("<tr></tr>").append($("<td>"+"Included In Blocks"+"</td>"), $("<td></td>").append(tx.blockHeight))
          );
        
        for (var i=0; i<vin.length; i++)
        {
          var asm = "";
          if (vin[i].scriptSig && vin[i].scriptSig.asm)
            asm = $("<tr></tr>").append($("<td></td>").append(unescape(vin[i].scriptSig.asm)));
          else
            asm = $("<tr></tr>").append($("<td></td>").append(JSON.stringify(vin[i])));
            
          $('#txs_inputs_table').append(asm);
        }
       
        var totalOutput = 0.0;
        for (var i=0; i<vout.length; i++)
        {
          totalOutput += vout[i].value;
          
          var asm = "";
          if (vout[i].scriptPubKey && vout[i].scriptPubKey.asm)
            asm = $("<tr></tr>").append($("<td></td>").append(unescape(vout[i].scriptPubKey.asm)));
          else
            asm = $("<tr></tr>").append($("<td></td>").append(JSON.stringify(vout[i])));
            
          $('#txs_outputs_table').append(asm);
        }
        
        $('#txs_io_table').append(
          $("<tr></tr>").append($("<td>"+"Total Input"+"</td>"), $("<td></td>").append(totalInput)),
          $("<tr></tr>").append($("<td>"+"Total Output"+"</td>"), $("<td></td>").append(totalOutput)),
          $("<tr></tr>").append($("<td></td>"), $("<td></td>"))
          );
      }
    })
    .fail(function() {
//      alert( "error" );
    });

};

exports.GetLastTransactions = function(mempoolTXs, lengthPool)
{
    if ($('#main_page').is(':hidden')) return;
    
    $.getJSON( "/api/v1/getlasttransactions?count=10", function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        if (lengthPool)
          mempoolTXs = mempoolTXs.slice(0, lengthPool).concat(data.data).slice(0, 10);
        else
          mempoolTXs = data.data.concat(mempoolTXs).slice(0, 10);

        exports.UpdateTxTable(mempoolTXs);
      }
    })
    .fail(function(){}
    );
};
 
exports.UpdateTxTable = function(mempoolTXs)
{
    $('#table_mempool').find("tr:gt(0)").remove();
    for (var i=0; i<mempoolTXs.length; i++)
    {
      $('#table_mempool').append($('<tr></tr>').append($('<td></td>').append(exports.CreateTxHash(mempoolTXs[i].txid))));
    }
};

exports.CreateTxHash = function(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="/transaction/'+hash+'">'+hash+'</a></td>');  
  /*ret[0].onclick = function()
  {
    exports.ShowTransaction($(this).attr('hash'));
  };*/
  return ret;
};

exports.ShowTransactionInfo = function(hash, vin, vout, table, cls)
{
  var totalInput = 0.0;
  var td1 = $("<td></td>");    
  for (var i=0; i<vin.length; i++)
  {
    if (vin[i].vout_o && vin[i].vout_o.scriptPubKey && vin[i].vout_o.scriptPubKey.addresses && vin[i].vout_o.scriptPubKey.addresses.length)
    {
      const outValue = parseFloat(vin[i].vout_o.value || 0);
      totalInput += outValue;
      
      td1.append(g_addr.CreateAddrHash(vin[i].vout_o.scriptPubKey.addresses[0]), "<span class='"+(cls || "active")+"'> ( "+ outValue + " )</span>");
    }
    else if (vin[i].txid)
      td1.append(exports.CreateTxHash(vin[i].txid), " (out = "+ vin[i].vout + ")");
    else if (vin[i].coinbase)
      td1.append("Coinbase");
        
    td1.append("<br><br>");
  }
    
  var td2 = " >> ";
    
  var td3 = $("<td></td>");
  for (var i=0; i<vout.length; i++)
  {
    if (vout[i].scriptPubKey && vout[i].scriptPubKey.addresses)
    {
      td3.append("[ ");
      for (var j=0; j<vout[i].scriptPubKey.addresses.length; j++)
        td3.append(g_addr.CreateAddrHash(vout[i].scriptPubKey.addresses[j]));
      td3.append(" ]" + "<span class='pull-right'>" + (vout[i].value || "") + "</span>");
    }
    else 
      td3.append("???" + "<span class='pull-right'>" + (vout[i].value || "") + "</span>");
      
    td3.append("<br><br>");
  }
    
  $(table).append(
    $("<tr></tr>").append(td1).append("<td class='"+(cls || "active")+"'>"+td2+"</td>").append(td3)
  );
      
  return totalInput;
};
