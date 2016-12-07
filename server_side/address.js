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
          $("<div class='row-fluid'></div>").append(
             $(g_utils.LeftTable(12, "addr_inputs_table", "Transactions", "")))
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
          
        $('#addr_io_table').append(
          $("<tr></tr>").append($("<td>"+"No. Transactions"+"</td>"), $("<td></td>").append(data.data.length)),
          $("<tr></tr>").append($("<td>"+"Total Received"+"</td>"), $("<td></td>").append(recieved)),
          $("<tr></tr>").append($("<td>"+"Final Balance"+"</td>"), $("<td></td>").append(balance))
          );
          
        for (var i=0; i<data.data.length; i++)
        {
          if (data.data[i].txin.length > 1)
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(data.data[i].txin)))));
          if (data.data[i].txout.length > 1)
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(g_txs.CreateTxHash(unescape(data.data[i].txout)))));
        }

      }
    });
};

exports.CreateAddrHash = function(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="#">'+hash+'</a></td>');  
  ret[0].onclick = function()
  {
    exports.ShowAddress($(this).attr('hash'));
  };
  return ret;
};