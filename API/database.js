'use strict';

var sqlite3 = require('sqlite3').verbose();

const g_constants = require('../constants');
const g_utils = require('../utils');

var g_db;

exports.Init = function() {
    console.log('Init database start');
    g_db = new sqlite3.Database(g_constants.dbName);
    
    //g_db.run("VACUUM");
    /*g_db.run("CREATE INDEX IF NOT EXISTS addr ON Address (address)", function(err){
        if (err) throw err.message;
    });
    g_db.run("CREATE INDEX IF NOT EXISTS txHash ON Transactions (txid)", function(err){
        if (err) throw err.message;
    });
    g_db.run("CREATE INDEX IF NOT EXISTS blk ON Blocks (hash, height, time)", function(err){
        if (err) throw err.message;
    });*/
    
    ///!!!DEBUG
   // g_db.run('DROP TABLE KeyValue');
   // g_db.run('DROP TABLE Address');
   // g_db.run('ALTER TABLE Users ADD COLUMN payment_address TEXT');
   
    function CreateIndex(indexObject)
    {
        g_db.run("CREATE INDEX IF NOT EXISTS "+indexObject.name+" ON "+indexObject.table+" ("+indexObject.fields+")", function(err){
            if (err) throw err.message;
        });
    }
    
    function CreateTable(dbTables, nIndex, cbError)
    {
        console.log('CreateTable nIndex='+nIndex);
        
        var cols = ' (';
        for (var i=0; i<dbTables[nIndex].cols.length; i++) {
            cols += dbTables[nIndex].cols[i][0] + ' ' + dbTables[nIndex].cols[i][1];
            
            if (i != dbTables[nIndex].cols.length-1)
                cols += ', ';
        }
        
        if (dbTables[nIndex].commands) cols += ", "+dbTables[nIndex].commands;
    
         cols += ')';
         
         console.log('CreateTable '+'CREATE TABLE IF NOT EXISTS ' + dbTables[nIndex].name + cols);
         g_db.run('CREATE TABLE IF NOT EXISTS ' + dbTables[nIndex].name + cols, function(err) {
            if (!err)
            {
                cbError(false);
                return;
            }
                
            console.log(err.message);
            cbError(true);
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
        InsertCommon(tableObject, values, false);
    }
    function Insert2(tableObject, values)
    {
        InsertCommon(tableObject, values, true);
   }
    function InsertCommon(tableObject, values, bToMemory)
    {
        try {
            var callbackERR = values[values.length-1];
            
            if (values.length-1 != tableObject.cols.length ) {
                console.log('ERROR: Insert to table "'+tableObject.name+'" failed arguments count: ' + (values.length-1));
                
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
            if (bToMemory)
            {
                exports.addMemQuery('INSERT INTO ' + tableObject.name + ' VALUES ' + vals);
                callbackERR(false);
            }
            else
            {
                g_db.run('INSERT INTO ' + tableObject.name + ' VALUES ' + vals, function(err) {
                    if (callbackERR) callbackERR(err);
                    if (err) 
                        console.log('INSERT error: ' + err.message);
                });
            }
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
    
    console.log('Init database step 1');

    g_db.parallelize(function(){
        
       // g_constants.dbTables['selectAll'] = function(name, cols, where, other, callback, param) {
       //         SelectAll(cols, name, where, other, callback, param);};
        console.log('Init database step 2 (g_constants.dbTables.length='+g_constants.dbTables.length+')');
                
        g_utils.ForEachSync(g_constants.dbTables, CreateTable, function(err) {
            if (err) throw 'unexpected init db error 2';
            
            for (var i=0; i<g_constants.dbIndexes.length; i++)
                CreateIndex(g_constants.dbIndexes[i]);
                
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
        }, function(err, params, cbError){
            if (err) throw 'unexpected init db error 1';
            
            console.log('Init database tables');
            
            const i = params.nIndex;
            
            g_constants.dbTables[g_constants.dbTables[i]['name']] = g_constants.dbTables[i];
           
            g_constants.dbTables[i]['insert'] = function() {
                Insert(this, arguments);};
            g_constants.dbTables[i]['insert2'] = function() {
                Insert2(this, arguments);};
            
            g_constants.dbTables[i]['update'] = function(SET, WHERE, callback) {
                Update(this.name, SET, WHERE, callback);};
            
            g_constants.dbTables[i]['delete'] = function(WHERE) {
                Delete(this.name, WHERE);};
            
            g_constants.dbTables[i]['selectAll'] = function(cols, where, other, callback, param) {
                SelectAll(cols, this.name, where, other, callback, param);};
            
            cbError(false);
        });
        /*for (var i=0; i<g_constants.dbTables.length; i++)
        {
            CreateTable(g_constants.dbTables[i]);
            
            g_constants.dbTables[g_constants.dbTables[i]['name']] = g_constants.dbTables[i];
           
            g_constants.dbTables[i]['insert'] = function() {
                Insert(this, arguments);};
            g_constants.dbTables[i]['insert2'] = function() {
                Insert2(this, arguments);};
            
            g_constants.dbTables[i]['update'] = function(SET, WHERE, callback) {
                Update(this.name, SET, WHERE, callback);};
            
            g_constants.dbTables[i]['delete'] = function(WHERE) {
                Delete(this.name, WHERE);};
            
            g_constants.dbTables[i]['selectAll'] = function(cols, where, other, callback, param) {
                SelectAll(cols, this.name, where, other, callback, param);};
                
        }
        
        for (var i=0; i<g_constants.dbIndexes.length; i++)
            CreateIndex(g_constants.dbIndexes[i]);*/

        /*g_constants.dbTables['selectAll'] = function(name, cols, where, other, callback, param) {
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
        };*/
            
    });
};

exports.RunTransactions = function()
{
    Begin();
    
    function Begin()
    {
        g_db.run('BEGIN TRANSACTION', function(err){
            if (!err)
                setTimeout(End, 1000000);
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

var g_memQueries = [];
exports.addMemQuery = function(strQuery) 
{
    if (!strQuery || !strQuery.length) throw 'invlid SQL query';
    
    g_memQueries.push(strQuery);
};
exports.RunMemQueries = function(callback)
{
    if (!g_memQueries.length)
    {
        callback(false);
        return;
    }
    exports.BeginTransaction(function() {
        g_memQueries.forEach(function(val, index, array){
             g_db.run(val, function(error) {
                 if (error) throw 'RunMemQueries unexpected error for query='+val;
             });
        });
        g_memQueries = [];
        exports.EndTransaction(callback);
    });
    
}

