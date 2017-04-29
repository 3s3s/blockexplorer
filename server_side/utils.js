'use strict';

const $ = require('jquery');
//const g_addr = require("./address");

exports.HideAll = function()
{
  $('#main_page').hide();
  $('#block_page').hide();
  $('#tx_page').hide();
  $('#addr_page').hide();
};

exports.Header = function(str, small, h)
{
  const height = h || 'h1';
  
  var ret =
          '<div class="page-header">'+
            '<'+height+'>'+str + (small || "") + '</'+height+'>' +
          '</div>';
  return ret;
};

exports.LeftTable = function()
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
};

exports.UTC = function(unixtime)
{
  if (unescape(unixtime).indexOf('UTC') > 0)
    return unescape(unixtime);
  return (new Date(unescape(unixtime)*1000)).toUTCString();
}

