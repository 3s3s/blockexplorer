'use strict';

var sqlite3 = require('sqlite3').verbose();

const g_constants = require('../constants');

exports.Init = function() {
    var g_db = new sqlite3.Database(g_constants.dbName);
    
    g_db.run("VACUUM");
    
    ///!!!DEBUG
   // g_db.run('DROP TABLE KeyValue');
  //  g_db.run('DROP TABLE Orders');
   // g_db.run('ALTER TABLE Users ADD COLUMN payment_address TEXT');
    
    function CreateTable(tableObject)
    {
        var cols = ' (';
        for (var i=0; i<tableObject.cols.length; i++) {
            cols += tableObject.cols[i][0] + ' ' + tableObject.cols[i][1];
            
            if (i != tableObject.cols.length-1)
                cols += ', ';
        }
    
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
            if (values.length != tableObject.cols.length ) {
                console.log('Insert failed arguments count: ' + values.length);
                return;
            }
            
            var vals = ' (';
            for (var i=0; i<values.length; i++) {
                vals += "'" + escape(values[i]) + "'";
                
                if (i != values.length-1)
                    vals += ', ';
            }
            vals += ')';
            
            console.log('INSERT INTO ' + tableObject.name + ' VALUES ' + vals);
            g_db.run('INSERT INTO ' + tableObject.name + ' VALUES ' + vals, function(err) {
                if (!err) 
                    return;
                console.log('INSERT error: ' + err.message);
            });
        }
        catch(e) {
            console.log(e.message);
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
                 
            g_db.all(query, param, function(err, rows) {
                if (err)
                    console.log("SELECT ERROR: query="+query+" message=" + err.message);
                
                callback(err, rows);
            });        
        }
        catch (e) {
            console.log(e.message);
        }
    }
    function Update(tableName, SET, WHERE)
    {
        try {
            let query = 'UPDATE ' + tableName;
            
            if (!SET || !SET.length)  throw "Table Update MUST have 'SET'";
            if (!WHERE || !WHERE.length) throw "Table Update MUST have 'WHERE'";
                
            query += ' SET ' + SET;
            query += ' WHERE ' + WHERE;
            
            console.log(query);   
            g_db.run(query, function(err) {
                if (!err)
                    return;
                console.log("UPDATE error: " + err.message);
            });
        }
        catch(e) {
            console.log(e.message);
        }
    }
    
    g_db.serialize(function(){
        for (var i=0; i<g_constants.dbTables.length; i++)
        {
            CreateTable(g_constants.dbTables[i]);
            
            g_constants.dbTables[g_constants.dbTables[i]['name']] = g_constants.dbTables[i];
           
            g_constants.dbTables[i]['insert'] = function() {
                Insert(this, arguments);};
            
            g_constants.dbTables[i]['update'] = function(SET, WHERE) {
                Update(this.name, SET, WHERE);};
            
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




