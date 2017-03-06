var mysql = require('mysql');
var config = require('../../constants.js');

/**
 * @param {Object} params
 */
function Db(params){
    this.connection = null;
    if(params)
    {
        this.params = params;
    }
    else{
        console.error('No database config');
    }
}

Db.prototype.isConnected = function(){
    return this.connection ? true : false;
}
Db.prototype.connect = function(next, callback){
    if(this.connection)
	{
		console.log('Mysql connectionExists, call next');
		if(next)
			next();
		
        return;
	}
    
    var connection = mysql.createConnection(this.params);
    var instance = this;

	try{
		var result = connection.connect(function(err){
			if(err)
			{
				console.error('error connecting: ' + err.stack);
				if(callback)
					callback(err.stack);
				return;
			}
			
			instance.connection = connection;
			console.log('mysql connect success, id ' + connection.threadId);
			
			if(next)
				next();
		});
	}
	catch (e){
		console.error(e);
		if(callback)
			callback('Failed to connect to database');
	}
};

Db.prototype.query = function(sql,vars, callback){
	var instance = this;
    this.connect(function(){
		console.log('query start');
		instance.connection.query(sql, vars, callback);
	}, callback);
	
};

var db = new Db(config.mysql);

module.exports = db;