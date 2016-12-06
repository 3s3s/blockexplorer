'use strict';

const $ = require('jquery');

function HideAll()
{
  $('#main_page').hide();
  $('#block_page').hide();
  $('#tx_page').hide();
  $('#addr_page').hide();
}

function InitSearch()
{
    const inputSearch = $('<input id="main_search_input" type="text" placeholder="block or transaction or address" class="form-control main-search">');
    
    inputSearch.on('keypress', function (e) {
        if(e.which === 13 && inputSearch.val().length) {
            e.preventDefault();
            
            if (!isNaN(inputSearch.val())) //block number
            {
              ShowBlock(inputSearch.val());
              return;
            }
            if (inputSearch.val().length < 50)
            {
              ShowAddress(inputSearch.val());
              return;
            }
    
            ShowBlock(inputSearch.val(), function(error) {
              if (error)
                ShowTransaction(inputSearch.val());
            });
            
          /*  $.getJSON( "/api/v1/search?"+encodeURIComponent(inputSearch.val()), function(data) {
              alert( "success! data="+JSON.stringify(data) );
            })
              .fail(function() {
                alert( "error" );
              })*/
        }
    });
    
    $("#main_search_form").append('<div class="form-group"></div>').append(inputSearch);
}

var g_mempoolTXs = [];
function InitMempoolTimer()
{
  GetMempool(); setInterval(GetMempool, 3000);
  
  function GetMempool()
  {
    $.getJSON( "/api/v1/getmempool?count=10", function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        //var oldFirstID = g_mempoolTXs.length ? g_mempoolTXs[0].txid : "";
        g_mempoolTXs = data.data.slice(0, 10);
        
        //var bFirstUpdated = (!oldFirstID.length || !g_mempoolTXs.length || g_mempoolTXs[0].txid != oldFirstID)
        if (g_mempoolTXs.length < 10 || !data.data.length)
        {
          GetLastTransactions(data.data.length);
          return;
        }
        
        UpdateTxTable();
        //alert( "success! data = "+JSON.stringify(data) );
      }
    })
    .fail(function() {
//      alert( "error" );
    })
  }

  function GetLastTransactions(lengthPool)
  {
    if ($('#main_page').is(':hidden')) return;
    
    $.getJSON( "/api/v1/getlasttransactions?count=10", function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        if (lengthPool)
          g_mempoolTXs = g_mempoolTXs.slice(0, lengthPool).concat(data.data).slice(0, 10);
        else
          g_mempoolTXs = data.data.concat(g_mempoolTXs).slice(0, 10);

        UpdateTxTable();
      }
    })
    .fail(function(){}
    );
  }
  
  function UpdateTxTable()
  {
    $('#table_mempool').find("tr:gt(0)").remove();
    for (var i=0; i<g_mempoolTXs.length; i++)
    {
     // var th = 
     //   "<td>"+CreateTxHash(g_mempoolTXs[i].txid)+"</td>"; 

      $('#table_mempool').append($('<tr></tr>').append($('<td></td>').append(CreateTxHash(g_mempoolTXs[i].txid))));
    }
  }
}

var g_Blocks = [];
function InitBlocksTimer()
{
  //const nCount = -1;
  
  GetLastBlocks(); setInterval(GetLastBlocks, 10000);
  
  function GetLastBlocks()
  {
    if ($('#main_page').is(':hidden')) return;
    
    $.getJSON( "/api/v1/getlastblocks?count=10", function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        g_Blocks = data.data.concat(g_Blocks).slice(0, 10);
        
        $('#table_blocks').find("tr:gt(0)").remove();
        for (var i=0; i<g_Blocks.length; i++)
        {
          const hashBlock = CreateBlockHash(g_Blocks[i].hash);/*$('<a hash="'+g_Blocks[i].hash+'" href="#">'+g_Blocks[i].hash+'</a></td>');
          hashBlock[0].onclick = function()
          {
            ShowBlock($(this).attr('hash'));
          }*/
          
          $('#table_blocks').append($("<tr></tr>").append(
              "<td>"+g_Blocks[i].height+"</td>" + 
              "<td>"+unescape(g_Blocks[i].time)+"</td>" + 
              "<td>"+JSON.parse(unescape(g_Blocks[i].tx)).length+"</td>",
              $("<td></td>").append(hashBlock),
              "<td>"+(parseInt(g_Blocks[i].size)*1.0/1024).toFixed(3)+"</td>")
            );
        }
        //alert( "success! data = "+JSON.stringify(data) );
      }
    })
    .fail(function() {
//      alert( "error" );
    });
    
  }
}

function CreateBlockHash(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="#">'+hash+'</a></td>');  
  ret[0].onclick = function()
  {
    ShowBlock($(this).attr('hash'));
  }
  return ret;
}

function CreateTxHash(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="#">'+hash+'</a></td>');  
  ret[0].onclick = function()
  {
    ShowTransaction($(this).attr('hash'));
  }
  return ret;
}

function CreateAddrHash(hash)
{
  if (!hash || !hash.length)
    return "";
    
  const ret = $('<a hash="'+hash+'" href="#">'+hash+'</a></td>');  
  ret[0].onclick = function()
  {
    ShowAddress($(this).attr('hash'));
  }
  return ret;
}

function ShowAddress(hash)
{
    $.getJSON( "/api/v1/getaddress?hash="+hash, function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        HideAll();
        
        if (!data.data.length)
          return;
          
        const addr = data.data[0];

        $('#addr_page').empty().append(
          $(Header("Address  ", "<small>Addresses are identifiers which you use to send bitcoins to another person</small>")),
 //         $("<div class='row-fluid'></div>").append(
 //           $(LeftTable(12, "addr_info_table", CreateAddrHash(unescape(data.data[0].address)), " ", " "))),
          $("<div class='row-fluid'></div>").append(
            $(LeftTable(6, "addr_table", "Summary", " ")),
            $(LeftTable(6, "addr_io_table", "Transactions", " "))),
          $("<div class='row-fluid'></div>").append(
             $(LeftTable(12, "addr_inputs_table", "Transactions", "")))
          )
          .show();
       
        $('#addr_table').append(
          $("<tr></tr>").append($("<td>"+"Address"+"</td>"), $("<td></td>").append(CreateAddrHash(unescape(data.data[0].address))))
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
          $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(CreateTxHash(unescape(data.data[i].txin)))));
          if (data.data[i].txout.length > 1)
            $('#addr_inputs_table').append($("<tr></tr>").append($("<td></td>").append(CreateTxHash(unescape(data.data[i].txout)))));
        }

      }
    });
}

function ShowTransaction(hash)
{
    $.getJSON( "/api/v1/gettransaction?hash="+hash, function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        HideAll();
        
        if (!data.data.length)
          return;
          
        const tx = data.data[0];

        $('#tx_page').empty().append(
          $(Header("Transaction  ", "<small>View information about a bitcoin transaction</small>")),
          $("<div class='row-fluid'></div>").append(
            $(LeftTable(12, "txs_info_table", CreateTxHash(unescape(tx.txid)), " ", " "))),
          $("<div class='row-fluid'></div>").append(
            $(LeftTable(6, "txs_table", "Summary", " ")),
            $(LeftTable(6, "txs_io_table", "Inputs and Outputs", " "))),
          $("<div class='row-fluid'></div>").append(
             $(LeftTable(12, "txs_inputs_table", "Input Scripts", " "))),
          $("<div class='row-fluid'></div>").append(
             $(LeftTable(12, "txs_outputs_table", "Output Scripts", " ")))
          )
          .show();
          
        const vin = data.data[0].vin;
        const vout = JSON.parse(unescape(data.data[0].vout));
        
        ShowTransactionInfo(tx.txid, vin, vout);
        
        $('#txs_table').append(
          $("<tr></tr>").append($("<td>"+"Received Time"+"</td>"), $("<td></td>").append(unescape(tx.time))),
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
          $("<tr></tr>").append($("<td>"+"Total Output"+"</td>"), $("<td></td>").append(totalOutput)),
          $("<tr></tr>").append($("<td></td>"), $("<td></td>"))
          );
      }
    })
    .fail(function() {
//      alert( "error" );
    });

  function ShowTransactionInfo(hash, vin, vout)
  {
    var td1 = $("<td></td>");    
    for (var i=0; i<vin.length; i++)
    {
      if (vin[i].vout_o && vin[i].vout_o.scriptPubKey && vin[i].vout_o.scriptPubKey.addresses && vin[i].vout_o.scriptPubKey.addresses.length)
      {
        td1.append(CreateAddrHash(vin[i].vout_o.scriptPubKey.addresses[0]), " ( "+ (vin[i].vout_o.value || 0) + " )");
      }
      else if (vin[i].txid)
        td1.append(CreateTxHash(vin[i].txid), " (out = "+ vin[i].vout + ")");
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
          td3.append(CreateAddrHash(vout[i].scriptPubKey.addresses[j]));
        td3.append(" ]" + "<span class='pull-right'>" + (vout[i].value || "") + "</span>");
      }
      else 
        td3.append("???" + "<span class='pull-right'>" + (vout[i].value || "") + "</span>");
        
      td3.append("<br><br>");
    }
    
    $('#txs_info_table').append(
      $("<tr></tr>").append(td1).append("<td>"+td2+"</td>").append(td3)
      );
  }
}

function ShowBlock(hash, callbackErr)
{
  var query = "hash="+hash;
  if (!isNaN(hash)) //block number
  {
    query = "height="+hash;
  }

    $.getJSON( "/api/v1/getblock?"+query, function(data) {
      if (data.status == 'success' && (data.data instanceof Object))
      {
        HideAll();
        
        $('#block_page').empty().append(
          $(Header("Block #"+data.data.height)),
          $("<div class='row-fluid'></div>").append(
            $(LeftTable(6, "block_table", "Summary", " ")),
            $(LeftTable(6, "block_hashes_table", "Hashes", " "))),
          $("<div class='row-fluid'></div>").append(
            $(LeftTable(12, "block_tx_table", "Transactions", " ")))
          )
          .show();
        
        $('#block_table').append(
          $("<tr></tr>").append("<td>"+"Number Of Transactions"+"</td>"+"<td>"+JSON.parse(unescape(data.data.tx)).length+"</td>"),
          $("<tr></tr>").append("<td>"+"Height"+"</td>"+"<td>"+data.data.height+"</td>"),
          $("<tr></tr>").append("<td>"+"Timestamp"+"</td>"+"<td>"+unescape(data.data.time)+"</td>"),
          $("<tr></tr>").append("<td>"+"Difficulty"+"</td>"+"<td>"+data.data.difficulty+"</td>"),
          $("<tr></tr>").append("<td>"+"Bits"+"</td>"+"<td>"+data.data.bits+"</td>"),
          $("<tr></tr>").append("<td>"+"Size"+"</td>"+"<td>"+data.data.size+"</td>"),
          $("<tr></tr>").append("<td>"+"Nonce"+"</td>"+"<td>"+data.data.nonce+"</td>")
          );

        //const blkHash = CreateBlockHash(data.data.hash);
        $('#block_hashes_table').append(
          $("<tr></tr>").append($("<td>"+"Hash"+"</td>"), $("<td></td>").append(CreateBlockHash(data.data.hash))),
          $("<tr></tr>").append($("<td>"+"Previous Block"+"</td>"), $("<td></td>").append(CreateBlockHash(data.data.previousblockhash))),
          $("<tr></tr>").append($("<td>"+"Next Block(s)"+"</td>"), $("<td></td>").append(CreateBlockHash(data.data.nextblockhash))),
          $("<tr></tr>").append("<td>"+"Merkle Root"+"</td>"+"<td>"+data.data.merkleroot+"</td>")
          );
          
        var txs = JSON.parse(unescape(data.data.tx));
        
        for (var i=0; i<txs.length; i++)
        {
          $('#block_tx_table').append($("<tr></tr>").append($("<td></td>").append(CreateTxHash(txs[i]))));
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
}

function Header(str, small)
{
  var ret =
          '<div class="page-header">'+
            '<h1>'+str + (small || "") + '</h1>' +
          '</div>';
  return ret;
}
function LeftTable()
{
  var th = $("<tr></tr>");
  for (var i=2; i<arguments.length; i++)
  {
    if (!arguments[i].length) 
      continue;
      
    th.append($('<th></th>').append(arguments[i]));
    //th += th"<th>"+arguments[i]+"</th>";
  }
  
  const tbody = arguments.length > 2 ? $("<tbody></tbody>").append(th) : $("<tbody></tbody>");

  const ret =
      $("<div class='col-xs-"+arguments[0]+"'></div>").append(
        $("<table id='"+arguments[1]+"' class='table table-striped'></table>").append(tbody));

  return ret;
}

$(function() {
    $('#block_page').hide();
    
    InitSearch();
    
    InitMempoolTimer();
    InitBlocksTimer();
    
    $('main_page').show();
});


//browserify --debug ~/workspace/server_side/main.js -s htmlEvents > ~/workspace/site/js/main.js