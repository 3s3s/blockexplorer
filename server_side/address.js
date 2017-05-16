'use strict';

const $ = require('jquery');
const g_utils = require("./utils");
const g_txs = require("./transactions");

function ShowAllTxInfo(hash, value)
{
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
    
    const maxLen = sortable.length > 20 ? 20 : sortable.length;
    for (var i=0; i<maxLen; i++)
    {
      const td3 = "<td><b><span class='pull-right'>"+g_utils.UTC(sortable[i][0].time)+"</span></b></td>";
      $('#addr_inputs_table').append($("<tr id='"+sortable[i][0].tx+"'></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(sortable[i][0].tx)))).append($("<td></td>")).append($(td3)));
      
      ShowAllTxInfo(sortable[i][0].tx, sortable[i][0].value);
    }
    
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
        /*for (var i=0; i<data.data.length; i++)
        {
          if (data.data[i].txin_info && data.data[i].txin_info.length)
          {
            for (var j=0; j<data.data[i].txin_info.length; j++)
            {
              if (!data.data[i].txin_info[j].vout) continue;
              const a = JSON.parse(unescape(data.data[i].txin_info[j].vout));
              if (!a || !a.length) continue;
              
              for (var k=0; k<a.length; k++)
              {
                const valueIN = a[k].value;
                recieved += parseFloat(valueIN); //parseFloat(data.data[i].value);
              }
            }
          }

          if (data.data[i].txout && data.data[i].txout.length == 1 && data.data[i].txout != '0')
          {
            balance += parseFloat(data.data[i].value);
          }
          else
          {
            balance = balance;
          }
        }*/
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
            txs.push({'tx' : data.data[i].txin, 'info' : data.data[i].txin_info, 'vout' : data.data[i].txin_info[0].vout, 'time' : data.data[i].time, 'status' : 'success'});
          if (data.data[i].txout.length > 1 && data.data[i].txout_info && data.data[i].txout_info.length)
            txs.push({'tx' : data.data[i].txout, 'info' : data.data[i].txout_info, 'vout' : data.data[i].txout_info[0].vout, 'time' : data.data[i].txout_info[0].time || data.data[i].time, 'status' : 'danger'});
        }
        
        txs.sort(function(tx1, tx2) {
          return (tx2.info[0].blockHeight - tx1.info[0].blockHeight);
        });
        
        for (var i=0; i<txs.length; i++)
        {
            const td3 = "<td><b><span class='pull-right'>"+g_utils.UTC(txs[i].time)+"</span></b></td>";
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(txs[i].tx)))).append($("<td></td>")).append($(td3)));
            
            const vout = JSON.parse(unescape(txs[i].vout));
            g_txs.ShowTransactionInfo(txs[i].tx, txs[i].info[0].vin, vout, '#addr_inputs_table', txs[i].status);
        }
        
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