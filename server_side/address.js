'use strict';

const $ = require('jquery');
const g_utils = require("./utils");
const g_txs = require("./transactions");

//ShowAllTxInfo(sortable[i][0].tx, sortable[i][0].value);
function ShowAllTxInfo(table, index)
{
  const hash = table[index][0].tx;
  const value = table[index][0].value;
  
  $.getJSON( "/api/v1/gettransaction?hash="+hash, function(data) {
    if (data.status != 'success' || !data.data || !data.data.length)
    {
      $('#'+hash).after($("<tr></tr>"));
      return;
    }
    
    const tx = data.data[0];
    const vin = data.data[0].vin;
    const vout = JSON.parse(unescape(data.data[0].vout));
    
    g_txs.ShowTransactionInfo(tx.txid, vin, vout, '#'+hash, (parseFloat(value) < 0) ? 'danger' : 'success');
    
    if (index+1 < table.length)
      ShowAllTxInfo(table, index+1);

  });
}

function ShowAddress2(hash)
{
  $.getJSON( "/api/v1/getaddress?hash="+hash, function(data) {
    if (data.status != 'success' || !data.data)
    {
      alert('error' + (data.message ? ": "+data.message : ""));
      return;
    }
    
    var recieved = 0;
    var mapTxToAmount = {};
    for (var i=0; i<data.data.length; i++)
    {
      if (data.data[i].txin && !mapTxToAmount[data.data[i].txin]) 
        mapTxToAmount[data.data[i].txin] = {value : 0, time : data.data[i].time, height : data.data[i].height, tx : data.data[i].txin};
      
      if (data.data[i].txout != '0' && !mapTxToAmount[data.data[i].txout]) 
        mapTxToAmount[data.data[i].txout] = {value : 0, time: data.data[i].time, height: data.data[i].height, tx : data.data[i].txout};
        
      if (mapTxToAmount[data.data[i].txin])
      {
        mapTxToAmount[data.data[i].txin].value += g_utils.MakeFloat(data.data[i].value || 0);
        recieved += g_utils.MakeFloat(data.data[i].value || 0);
      }
      if (mapTxToAmount[data.data[i].txout])
        mapTxToAmount[data.data[i].txout].value -= g_utils.MakeFloat(data.data[i].value || 0);
    }
    
    var balance = 0;
    var sortable = [];
    for (var key in mapTxToAmount) {
        sortable.push([mapTxToAmount[key], mapTxToAmount[key].height]);
        balance += mapTxToAmount[key].value;
    }
    
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    }); 
    
    g_utils.HideAll();
    
    $('#addr_page').empty().append(
      $(g_utils.Header("Address  ", "<small>Addresses are identifiers which you use to send bitcoins to another person</small>")),
 //     $("<div class='row-fluid'></div>").append(
 //       $(LeftTable(12, "addr_info_table", CreateAddrHash(unescape(data.data[0].address)), " ", " "))),
      $("<div class='row-fluid'></div>").append(
        $(g_utils.LeftTable(6, "addr_table", "Summary", " ")),
        $(g_utils.LeftTable(6, "addr_io_table", "Transactions", " "))),
        $(g_utils.Header("Transactions  ", "<small>(newest first)</small>", 'h2')),
        $("<div class='row-fluid'></div>").append(
           $(g_utils.LeftTable(12, "addr_inputs_table")))
    ).show();
       
      $('#addr_table').append(
        $("<tr></tr>").append($("<td>"+"Address"+"</td>"), $("<td></td>").append(exports.CreateAddrHash(unescape(data.data[0].address))))
    );
    
    const maxLen = sortable.length;// > 2000 ? 2000 : sortable.length;
    for (var i=0; i<maxLen; i++)
    {
      const td3 = "<td><b><span class='pull-right'>"+g_utils.UTC(sortable[i][0].time)+"</span></b></td>";
      $('#addr_inputs_table').append($("<tr id='"+sortable[i][0].tx+"'></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(sortable[i][0].tx)))).append($("<td></td>")).append($(td3)));
      
      //ShowAllTxInfo(sortable[i][0].tx, sortable[i][0].value);
    }
    ShowAllTxInfo(sortable, 0);
    
       /* for (var i=0; i<txs.length; i++)
        {
            const td3 = "<td><b><span class='pull-right'>"+g_utils.UTC(txs[i].time)+"</span></b></td>";
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(txs[i].tx)))).append($("<td></td>")).append($(td3)));
            
            const vout = JSON.parse(unescape(txs[i].vout));
            g_txs.ShowTransactionInfo(txs[i].tx, txs[i].info[0].vin, vout, '#addr_inputs_table', txs[i].status);
        }*/
        
    $('#addr_io_table').append(
      $("<tr></tr>").append($("<td>"+"No. Transactions"+"</td>"), $("<td></td>").append(sortable.length)),
      $("<tr></tr>").append($("<td>"+"Total Received"+"</td>"), $("<td></td>").append(recieved)),
      $("<tr></tr>").append($("<td>"+"Final Balance"+"</td>"), $("<td></td>").append(balance))
    );
  });
}
exports.ShowAddress = function(hash)
{
  ShowAddress2(hash);
  return;
  
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