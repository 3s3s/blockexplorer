'use strict';

const $ = require('jquery');

function InitSearch()
{
    const inputSearch = $('<input id="main_search_input" type="text" placeholder="block or transaction or address" class="form-control main-search">');
    
    inputSearch.on('keypress', function (e) {
        if(e.which === 13 && inputSearch.val().length) {
            e.preventDefault();
    
            $.getJSON( "/api/v1/search?"+encodeURIComponent(inputSearch.val()), function(data) {
              alert( "success! data="+JSON.stringify(data) );
            })
              .fail(function() {
                alert( "error" );
              })
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
      var th = 
        "<td>"+g_mempoolTXs[i].txid+"</td>"; 

      $('#table_mempool').append('<tr>'+th+'</tr>');
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
                  /* <th>Height</th>
                    <th>Age</th>
                    <th>Transactions</th>
                    <th>Total Sent</th>
                    <th>Size (kB)</th>*/
          var hashBlock = $('<a hash="'+g_Blocks[i].hash+'" href="#">'+g_Blocks[i].hash+'</a></td>');
          hashBlock[0].onclick = function()
          {
            ShowBlock($(this).attr('hash'));
          }
          
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

function ShowBlock(hash)
{
    $.getJSON( "/api/v1/getblock?hash="+hash, function(data) {
      if (data.status == 'success' && (data.data instanceof Object))
      {
        $('#main_page').hide();
        
        $('#block_page').empty().append(
          $(Header("Block #"+data.data.height)),
          $(LeftTable(8, "Summary", ""))
          )
          .show();
      }
    })
    .fail(function() {
//      alert( "error" );
    });
}

function Header(str)
{
  var ret =
          '<div class="page-header">'+
            '<h1>'+str + '</h1>' +
          '</div>';
  return ret;
}
function LeftTable()
{
  var th = "";
  for (var i=1; i<arguments.length; i++)
  {
    th += "<th>"+arguments[i]+"</th>";
  }

  var ret =
    $("<div class='row-fluid'></div>").append(
      $("<div class='span"+arguments[0]+"'></div>").append(
        $("<table id='left_table' class='table table-striped'></table>").append(
          $("<tbody></tbody>").append(
            $("<tr></tr>").append(
              $(th))
          )
        )
      )
    );
    
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