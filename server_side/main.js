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
  const nCount = -1;
  
  setInterval(function(){
    $.getJSON( "/api/v1/getmempool?"+nCount, function(data) {
      if (data.status == 'success' && (data.data instanceof Array))
      {
        g_mempoolTXs = data.data.push.apply(data.data, g_mempoolTXs).slice(0, 10);
        
        for (var i=0; i<g_mempoolTXs.length; i++)
        {
          $('#table_mempool').append('<tr>'+g_mempoolTXs[i]+'/tr');
        }
        //alert( "success! data = "+JSON.stringify(data) );
      }
    })
    .fail(function() {
//      alert( "error" );
    })
  }, 10000);
}

$(function() {
    
    InitSearch();
    
    InitMempoolTimer();
});


//browserify --debug ~/workspace/server_side/main.js -s htmlEvents > ~/workspace/site/js/main.js