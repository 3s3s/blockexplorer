'use strict';

var sqlite3 = require('sqlite3').verbose();

const g_constants = require('../constants');

var g_db;

exports.Init = function() {
    g_db = new sqlite3.Database(g_constants.dbName);
    
    g_db.run("VACUUM");
    
    ///!!!DEBUG
   // g_db.run('DROP TABLE KeyValue');
   // g_db.run('DROP TABLE Address');
   // g_db.run('ALTER TABLE Users ADD COLUMN payment_address TEXT');
    
    function CreateTable(tableObject)
    {
        var cols = ' (';
        for (var i=0; i<tableObject.cols.length; i++) {
            cols += tableObject.cols[i][0] + ' ' + tableObject.cols[i][1];
            
            if (i != tableObject.cols.length-1)
                cols += ', ';
        }
        
        if (tableObject.commands) cols += ", "+tableObject.commands;
    
         cols += ')';
         
         g_db.run('CREATE TABLE IF NOT EXISTS ' + tableObject.name + cols, function(err) {
             if (!err)
                return;
                
             console.log(err.message);
         });
    }
    
    function Delete(table, where)
    {
        try
        {
            g_db.run('DELETE FROM ' + table + ' WHERE ' + where, function(err) {
                if (!err) 
                    return;
                console.log('DELETE error: ' + err.message);
            });
            
        }
        catch(e)
        {
            console.log(e.message);
        }
    }
    
    function Insert(tableObject, values)
    {
        try {
            var callbackERR = values[values.length-1];
            
            if (values.length-1 != tableObject.cols.length ) {
                console.log('Insert failed arguments count: ' + values.length-1);
                callbackERR(true);
                return;
            }
            
            var vals = ' (';
            for (var i=0; i<values.length-1; i++) {
                vals += "'" + escape(values[i]) + "'";
                
                if (i != values.length-2)
                    vals += ', ';
            }
            vals += ')';
            
            console.log('INSERT INTO ' + tableObject.name + ' VALUES ' + vals);
            g_db.run('INSERT INTO ' + tableObject.name + ' VALUES ' + vals, function(err) {
                if (callbackERR) callbackERR(err);
                if (err) 
                    console.log('INSERT error: ' + err.message);
            });
        }
        catch(e) {
            console.log(e.message);
            if (callbackERR) callbackERR(e);
        }
    }
    function SelectAll(cols, table, where, other, callback, param) 
    {
        try {
            let query = "SELECT " + cols + " FROM " + table;
            if (where.length)
                query += " WHERE " + where;
            if (other.length)
                 query += " " + other; 
                 
            if (!callback) 
            {
                console.log("WARNING: SelectAll callback undefined!!!");
            }
                 
            g_db.all(query, param, function(err, rows) {
                if (err)
                    console.log("SELECT ERROR: query="+query+" message=" + err.message);
                
                if (callback) callback(err, rows);
            });        
        }
        catch (e) {
            console.log(e.message);
            if (callback) callback(e);
        }
    }
    function Update(tableName, SET, WHERE, callback)
    {
        try {
            let query = 'UPDATE ' + tableName;
            
            if (!SET || !SET.length)  throw "Table Update MUST have 'SET'";
            if (!WHERE || !WHERE.length) throw "Table Update MUST have 'WHERE'";
                
            query += ' SET ' + SET;
            query += ' WHERE ' + WHERE;
            
            console.log(query);   
            g_db.run(query, function(err) {
                if (callback) callback(err);
                if (err)
                    console.log("UPDATE error: " + err.message);
            });
        }
        catch(e) {
            console.log(e.message);
            if (callback) callback(e);
        }
    }
    
    g_db.parallelize(function(){
        for (var i=0; i<g_constants.dbTables.length; i++)
        {
            CreateTable(g_constants.dbTables[i]);
            
            g_constants.dbTables[g_constants.dbTables[i]['name']] = g_constants.dbTables[i];
           
            g_constants.dbTables[i]['insert'] = function() {
                Insert(this, arguments);};
            
            g_constants.dbTables[i]['update'] = function(SET, WHERE, callback) {
                Update(this.name, SET, WHERE, callback);};
            
            g_constants.dbTables[i]['delete'] = function(WHERE) {
                Delete(this.name, WHERE);};
            
            g_constants.dbTables[i]['selectAll'] = function(cols, where, other, callback, param) {
                SelectAll(cols, this.name, where, other, callback, param);};
                
        }
        
        g_constants.dbTables['selectAll'] = function(name, cols, where, other, callback, param) {
                SelectAll(cols, name, where, other, callback, param);};
                
        g_constants.dbTables['KeyValue']['get'] = function(key, callback) {
            SelectAll("value", this.name, "key='"+escape(key)+"'", "", function(error, rows) {
                if (rows && rows.length && rows[0].value) 
                    callback(error, unescape(rows[0].value));
                else
                    callback(error, "");
            });
        };

        g_constants.dbTables['KeyValue']['set'] = function(key, value, callback) {
            this.get(key, function(error, rows) {
                if (error || (!rows.length))
                    g_constants.dbTables['KeyValue'].insert(key, value);
                if (!error && rows.length)
                    g_constants.dbTables['KeyValue'].update("value = '"+escape(value)+"'", "key='"+escape(key)+"'");
                    
                if (callback) callback();
            });
        };
            
    });
};

exports.RunTransactions = function()
{
    Begin();
    
    function Begin()
    {
        g_db.run('BEGIN TRANSACTION', function(err){
            if (!err)
                setTimeout(End, 10000);
            else
                setTimeout(Begin, 2000);
        });
    }
    
    function End()
    {
        g_db.run('END TRANSACTION', function(err){
            if (!err)
            {
               // g_db.run("VACUUM");
                setTimeout(Begin, 1);
            }
            else
                setTimeout(End, 2000);
        });
    }
};

exports.BeginTransaction = function (callback)
{
    g_db.run('BEGIN TRANSACTION', function(err){
        if (err) throw ("BeginTransaction error: " + err.message);
        if (callback) callback(err);
    });
};

exports.EndTransaction = function(callback)
{
    g_db.run('END TRANSACTION', function(err){
        if (err) throw ("EndTransaction error: " + err.message);
        if (callback) callback(err);
     });
};


