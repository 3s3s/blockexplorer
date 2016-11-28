'use strict';

const periodic = require("../periodic");

exports.GetMempool = function(query, res)
{
    res.end( JSON.stringify(periodic.GetMempoolTXs()) );
};