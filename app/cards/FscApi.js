var config = require('../conf/fscapi.json');
var request = require('request');

request = request.defaults({
	jar: true,
	headers:{
		'User-Agent': 'node js',
		'Content-Type': 'application/x-www-form-urlencoded'
	}
});

//var Sequence = require('sequence').Sequence;

function doPost(url, postParams, succ,err){
	request.post({
			url: config.host + url,
			form:postParams,
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log('post success',body);
				succ(body);
			}
			else
			{
				if(error)
					err(error);
				else
					err('Request error statusCode ' + response.statusCode);
			}
		}
	);
}

function doGet(url,succ,err){
	request.get({
			url:config.host + url,
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log('get success');
				succ(body);
			}
			else
			{
				if(error)
					err(error);
				else
					err('Request error, statusCode ' + response.statusCode);
			}
		}
	);
}

function ping(succ, err){
	doGet(
		'/counterpartyapi/ping',
		function(body){
			if(body.indexOf('PONG') === 0)
			{
				console.log('ping success: '+ body);
				succ();
			}
			else
			{
				console.log('ping body error');
				err('ping body error');
			}
		},
		err
	);
}

function auth(succ,err){
	console.log('Auth to fsc api');
	
	request.post({
			url: config.host + '/login',
			form:{username:config.username, password:config.password}
		},
		function (error, response, body) {
			if (!error && response.headers['set-cookie']) {
				
				console.log('auth success');
				succ();
			}
			else
			{
				console.error('auth error');
				if(error)
					err(error);
				else
					err('Request error statusCode ' + response.statusCode);
			}
		}
	);
}

function getErrors(responseBody){
	if(!responseBody)
		return "Invalid response";
	
	if(!responseBody.hasOwnProperty('success'))
	{
		if(responseBody.errors && responseBody.errors.length > 0)
			return responseBody.errors[0].defaultMessage;
	}
	
	if(responseBody.success)
		return null;
	
	return responseBody.errorDescription;
}

function changeAppStatus(appID, status, succ, err){
	console.log('changeAppStatus:', appID);
	console.log(appID);
	
	request.post({
			url: config.host + '/counterpartyapi/statusChange',
			form:{applicationId:appID, state: status, comment:'Auto change'}
		},
		function (error, response, body) {
			if (!error) {
				
				var data = JSON.parse(body);
				
				error = getErrors(data);
				
				if(error)
				{
					console.error('changeAppStatus fail:',  error);
					if(err) err(error);
				}
				else
				{
					console.log('changeAppStatus success:', body);
					if(succ) succ();
				}
			}
			else
			{
				console.error('changeAppStatus error:', error);
				if(err)
					err(error);
			}
		}
	);
}
function activatreApp(appID, succ, err){
	console.log('activatreApp:', appID);
	console.log(appID);
	
	request.post({
			url: config.host + '/counterpartyapi/assignapplicationfordocumentcheck',
			form:{applicationId:appID}
		},
		function (error, response, body) {
			if (!error) {
				
				var data = JSON.parse(body);
				
				error = getErrors(data);
				
				if(error)
				{
					console.error('activatreApp fail:',  error);
					if(err) err(error);
				}
				else
				{
					console.log('activatreApp success:', body);
					if(succ) succ();
				}
			}
			else
			{
				console.error('activatreApp error:', error);
				if(err)
					err(error);
			}
		}
	);
}
function checkDocumentValidity(appID, validDate,succ, err){
	console.log('checkDocumentValidity:', appID);
	console.log(appID);
	
	request.post({
			url: config.host + '/counterpartyapi/checkdocument',
			form:{applicationId:appID, description:'Auto generated message',idDocumentValidityPeriod : validDate}
		},
		function (error, response, body) {
			if (!error) {
				
				var data = JSON.parse(body);
				
				error = getErrors(data);
				
				if(error)
				{
					console.error('checkDocumentValidity fail:',  error);
					if(err) err(error);
				}
				else
				{
					console.log('checkDocumentValidity success:', body);
					if(succ) succ();
				}
			}
			else
			{
				console.error('checkDocumentValidity error:', error);
				if(err)
					err(error);
			}
		}
	);
}
function printAppStatus(appID, succ, err){
	console.log('printAppStatus:', appID);
	console.log(appID);
	
	request.post({
			url: config.host + '/counterpartyapi/checkappstate',
			form:{applicationId:appID}
		},
		function (error, response, body) {
			if (!error) {
				
				var data = JSON.parse(body);
				
				error = getErrors(data);
				
				if(error)
				{
					console.error('printAppStatus fail:',  error);
					if(err) err(error);
				}
				else
				{
					console.log('printAppStatus success:', body);
					if(succ) succ();
				}
			}
			else
			{
				console.error('printAppStatus error:', error);
				if(err)
					err(error);
			}
		}
	);
}
function registerWithoutKit(user, succ, err){
	console.log('registerWithoutKit', user);
	console.log(user);
	
	request.post({
			url: config.host + '/counterpartyapi/kitlessregistration',
			form:user
		},
		function (error, response, body) {
			if (!error) {
				
				var data = JSON.parse(body);
				
				error = getErrors(data);
				
				if(error)
				{
					console.error('registerWithoutKit fail: ' + error);
					if(err) err(error);
				}
				else
				{
					console.log('registerWithoutKit success' + body);
					if(succ) succ(data.registrationId);
				}
			}
			else
			{
				console.error('registerWithoutKit error:' + error);
				if(err)
					err(error);
			}
		}
	);
}

module.exports.registerWithoutKit = function(user, succ, err){
	
	ping(
		function(){//ping success
			registerWithoutKit(user,succ,err);
		},
		function (){//ping error need auth
			auth(function(){registerWithoutKit(user, succ, err);}, err);
		}
	);
};

module.exports.printAppStatus = function(appID, succ, err){
	
	ping(
		function(){//ping success
			printAppStatus(appID,succ,err);
		},
		function (){//ping error need auth
			auth(function(){printAppStatus(appID, succ, err);}, err);
		}
	);
};
module.exports.changeAppStatus = function(appID, status, succ, err){
	
	ping(
		function(){//ping success
				changeAppStatus(appID, status, succ,err);
		},
		function (){//ping error need auth
			auth(function(){changeAppStatus(appID, status, succ, err);}, err);
		}
	);
};

module.exports.activateApp = function(appID, succ, err){
	
	ping(
		function(){//ping success
				activatreApp(appID, succ,err);
		},
		function (){//ping error need auth
			auth(function(){activatreApp(appID, succ, err);}, err);
		}
	);
};
module.exports.activateApp = function(appID, succ, err){
	
	ping(
		function(){//ping success
				checkDocumentValidity(appID, succ,err);
		},
		function (){//ping error need auth
			auth(function(){activatreApp(appID, succ, err);}, err);
		}
	);
};