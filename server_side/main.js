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
        "<th>"+g_mempoolTXs[i].txid+"</th>"; 

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
          var th = 
            "<th>"+g_Blocks[i].height+"</th>" + 
            "<th>"+unescape(g_Blocks[i].time)+"</th>" + 
            "<th>"+JSON.parse(unescape(g_Blocks[i].tx)).length+"</th>" + 
            "<th>"+g_Blocks[i].hash+"</th>" +
            "<th>"+g_Blocks[i].size+"</th>"  
          $('#table_blocks').append('<tr>'+th+'</tr>');
        }
        //alert( "success! data = "+JSON.stringify(data) );
      }
    })
    .fail(function() {
//      alert( "error" );
    })
    
  }
}


$(function() {
    
    InitSearch();
    
    InitMempoolTimer();
    InitBlocksTimer();
});


//browserify --debug ~/workspace/server_side/main.js -s htmlEvents > ~/workspace/site/js/main.js