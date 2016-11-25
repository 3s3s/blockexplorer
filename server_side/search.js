'use strict';

const $ = require('jquery');

$(function() {
    
    const inputSearch = $('<input id="main_search_input" type="text" placeholder="block or transaction or address" class="form-control main-search">');
    
    inputSearch.on('keypress', function (e) {
        if(e.which === 13 && inputSearch.val().length) {
            e.preventDefault();
    
            //Disable textbox to prevent multiple submit
            //$(this).attr("disabled", "disabled");
    
//            alert('/search?'+encodeURIComponent(inputSearch.val()));
            $.getJSON( "/api/v1/search?"+encodeURIComponent(inputSearch.val()), function(data) {
              alert( "success data"+JSON.stringify(data) );
            })
              .fail(function() {
                alert( "error" );
              })
        }
    });
    
    $("#main_search_form").append('<div class="form-group"></div>').append(inputSearch);

});


//browserify --debug ~/workspace/server_side/search.js -s htmlEvents > ~/workspace/site/js/main.js