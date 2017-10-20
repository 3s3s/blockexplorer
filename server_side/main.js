'use strict';

const $ = require('jquery');
const g_txs = require('./transactions');
const g_addr = require("./address");
const g_blk = require("./block");
const g_utils = require("./utils");

function InitSearch()
{
    const inputSearch = $('<input id="main_search_input" type="text" placeholder="block or transaction or address" class="form-control main-search">');
    
    inputSearch.on('keypress', function (e) {
        if(e.which === 13 && inputSearch.val().length) {
            e.preventDefault();
            
            if (!isNaN(inputSearch.val())) //block number
            {
              g_blk.ShowBlock(inputSearch.val());
              return;
            }
            if (inputSearch.val().length < 50)
            {
              g_addr.ShowAddress(inputSearch.val());
              return;
            }
    
            g_blk.ShowBlock(inputSearch.val(), function(error) {
              if (error)
                g_txs.ShowTransaction(inputSearch.val());
            });
            
        }
    });
    
    $("#main_search_form").append('<div class="form-group"></div>').append(inputSearch);
}

function InitMempoolTimer()
{
  GetMempool(); setInterval(GetMempool, 3000);
  
  function GetMempool()
  {
    $.getJSON( "/api/v1/getmempool?count=10", function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        var mempoolTXs = data.data.slice(0, 10);
        
        //var bFirstUpdated = (!oldFirstID.length || !g_mempoolTXs.length || g_mempoolTXs[0].txid != oldFirstID)
        if (mempoolTXs.length < 10 || !data.data.length)
        {
          g_txs.GetLastTransactions(mempoolTXs, data.data.length);
          return;
        }
        
        g_txs.UpdateTxTable(mempoolTXs);
      }
    })
    .fail(function() {
//      alert( "error" );
    });
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
        if (data.data.length == 1 && data.data[0].height == 0 && g_Blocks.length)
        {}
        else
          g_Blocks = data.data.concat(g_Blocks).slice(0, 10);
        
        $('#table_blocks').find("tr:gt(0)").remove();
        for (var i=0; i<g_Blocks.length; i++)
        {
          const hashBlock = g_blk.CreateBlockHash(g_Blocks[i].hash);/*$('<a hash="'+g_Blocks[i].hash+'" href="#">'+g_Blocks[i].hash+'</a></td>');
          hashBlock[0].onclick = function()
          {
            ShowBlock($(this).attr('hash'));
          }*/
          
          $('#table_blocks').append($("<tr></tr>").append(
              "<td>"+g_Blocks[i].height+"</td>" + 
              "<td>"+g_utils.UTC(g_Blocks[i].time)+"</td>" + 
              "<td>"+JSON.parse(unescape(g_Blocks[i].tx)).length+"</td>",
              $("<td></td>").append(hashBlock),
              "<td>"+(parseInt(g_Blocks[i].size)*1.0/1024).toFixed(3)+"</td>")
            );
        }
      }
    })
    .fail(function() {
//      alert( "error" );
    });
    
  }
}

$(function() {
    //$('#block_page').hide();
    g_utils.HideAll();
    
    InitSearch();
    ShowCharts();

    const nBlock = window.location.href.indexOf('/block/');
    const nTX = window.location.href.indexOf('/transaction/');
    const nAddr = window.location.href.indexOf('/address/');
    
    if (nBlock != -1)
    {
      g_blk.ShowBlock(window.location.href.substr(nBlock+7), function(err) {
        if (err) alert('error');
      });
      return;
    }
    
    if (nTX != -1)
    {
      g_txs.ShowTransaction(window.location.href.substr(nTX+13));
      return;
    }
    
    if (nAddr != -1)
    {
      g_addr.ShowAddress(window.location.href.substr(nAddr+9));
      return;
    }
    
    $('#main_page').show();
    
    InitMempoolTimer();
    InitBlocksTimer();
    
});

function ShowCharts()
{
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawCharts);

  function drawCharts()
  {
    $.getJSON( "/api/v1/history/getdiff", function(data) {
      if (data.status == false)
        return;

      var dataChart = new google.visualization.DataTable();
      dataChart.addColumn('date', '');
      dataChart.addColumn('number', 'Difficulty');  
      
      var rows = [];
      for (var i=0; i<data.data.length; i += 10)
      {
        rows.push([new Date(data.data[i][0]), data.data[i][1]]);
      }
      dataChart.addRows(rows);
      
      var options = {
          title: 'Difficulty',
          height: 300,
          curveType: 'function',
          legend: {position: 'none'}
      };
      
      var chart = new google.visualization.LineChart(document.getElementById('diff_chart'));
      chart.draw(dataChart, options);
    });
  }
}


//browserify --debug server_side/main.js -s htmlEvents > site/js/main.js