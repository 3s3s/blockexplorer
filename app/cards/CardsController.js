/* @constant {Db} db */
const db = require('../db');
//var fscApi = require('./FscApi.js');
//var dateFormat = require('dateformat');

var coinPayConf = require('../conf/coinpayments.json');

var coinPay = require('coinpayments');
var client = new coinPay(coinPayConf.auth);

client.getTx('CPBB5RLGD84KPCYSNQAGQMZY3B',function(err,result){
  console.log(result);
});

var allowTypes = ['e','d','r'];

/**
 * Cards controller
 * 
 * @returns {undefined}
 */
function CardsController(){
	
}

function processPaidRequests(requests){	
	for (var i = 0, len = requests.length; i < len; i++) {
		if(!requests[i].intFscID)
		{
			var cardRequest = requests[i];
			fscApi.registerWithoutKit(
				prepareUserForApi(cardRequest),
				function(registrationId){
					console.log('register user success');
					
					db.query('update card_request set intFscID = ?, varStatus = \'registered\' where intRequestID = ?',
						[registrationId, cardRequest.intRequestID],
						function (error, results, fields) {
							if(error)
							{
								console.error('failed to update registrationId ' + error);
								return;
							}
							activateApp(registrationId);
						});
					
				},function(error){
					console.error('error register user ' + error);
				});
		}
	}	
}

function getUserRequests(callback, intUserID, type){
	db.query('select * from card_request where intUserID = ? and varType = ?',
		[intUserID, type],
		function (error, results, fields) {
			if(error)
			{
				console.error(error);
				callback(error);
				return;
			}
			
			console.log('found user cards with type %s: %d', type , results.length);
			request = results.length > 0 ? results[0] : null;
			callback(null, request);
		});
}

CardsController.prototype.registerPaidRequests = function() {
	db.query('select * from card_request r join user u on r.intUserID = u.intUserID where r.varStatus = ?',
		['paid'],
		function (error, results, fields) {
			if(error)
			{
				console.error(error);
				return;
			}
			console.log('found requests: ' + results.length);
			if(results.length > 0)
				processPaidRequests(results);
		});
};
/**
 * Handle the request for login page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
CardsController.prototype.index = function(req, res, next) {
	res.render('cards/cards',{
		message: req.flash('cards-message'),
		error_message: req.flash('cards-error')
	});
};

/**
 * Handle the request for pay page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
CardsController.prototype.pay = function(req, res, next) {
	getUserRequests(function(error, existsRequest){
		if(error)
		{
			req.flash('detail-error','Failed to get user requests');
			res.redirect('/card/' + req.params.type);
			return;
		}
		if(existsRequest)
		{
			if(existsRequest.varStatus != 'wait')
			{
				req.flash('detail-error','You can\'t pay with status ' + existsRequest.varStatus);
				res.redirect('/card/' + req.params.type);
			}
			var user = req.session.user;
			
			client.createTransaction({
					item_name: 'Card request',
					invoice: existsRequest.intRequestID,
					buyer_email: user.varEmail,
					buyer_name: user.varName + ' ' + user.varSurname,
					currency1:'USD',
					currency2:'BTC',
					amount : coinPayConf.amount,
					ipn_url:coinPayConf.ipn_host + '/coinpayments/ipn'
				}, function(err,transactionInfo){
				if(err)
				{
					console.error(err);
					req.flash('detail-error','Failed to create invoice.');
					res.redirect('/card/' + req.params.type);
				}
				console.log('transactInfo', transactionInfo);
				db.query('insert into `coin_payment_transaction` (`intRequestID`, `txn_id` , `amount`, `address`, `confirms_needed`, `timeout`, `status_url`, `qrcode_url` ) values(?,?,?,?,?,?,?,?)',
					[
						existsRequest.intRequestID,
						transactionInfo.txn_id,
						transactionInfo.amount,
						transactionInfo.address,
						transactionInfo.confirms_needed,
						transactionInfo.timeout,
						transactionInfo.status_url,
						transactionInfo.qrcode_url

					],
					function (error, results, fields) {
						if(error)
						{
							console.error(error);

							req.flash('detail-error','Failed to save transaction to database.');
							res.redirect('/card/' + req.params.type);
							return;
						}
						transactionInfo.status = 0;
						
						res.render('cards/pay-coinpayment',{transaction: transactionInfo});
					});
				});
		}
	}, req.session.user.intUserID, req.params.type);
};
/**
 * Handle the request for login page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
CardsController.prototype.cardRequest = function(req, res, next) {
	console.log('type indexof ', allowTypes.indexOf(req.params.type));
	
	if(allowTypes.indexOf(req.params.type) === -1)
	{
		req.flash('cards-error','Selected type not allowed. Please select another card type.');
		res.redirect('/cards');
		return;
	}
	
	getUserRequests(function(error, existsRequest){
		if(error)
		{
			res.render('cards/card-request-form',{
				request_error: "Failed to get user requests"
			});
			return;
		}
		if(existsRequest)
		{
			res.render('cards/card-request-detail',{
				baseUrl: 'https://'+req.headers.host,
				request: existsRequest,
				user: req.session.user,
				message: req.flash('card-message'),
				detail_error:req.flash('detail-error')
			});
			return;
		}
		if(req.method === 'POST')
		{
			req.checkBody({
				varAddress:{
					notEmpty: true,
					errorMessage:"Address is empty"
				},
				varCity:{
					notEmpty: true,
					errorMessage:"City is empty"
				},
				varCountry:{
					notEmpty: true,
					errorMessage:"Country is empty"
				},
				varZip:{
					notEmpty: true,
					errorMessage:"Zip is empty"
				}
			});

			var formErrors = req.validationErrors(true);

			if(!formErrors)
			{
				db.query('insert into `card_request` (`varAddress`, `varCity` , `varCountry`, `varZip`, `intUserID`, `varType` ) values(?,?,?,?,?,?)',
					[req.body.varAddress, req.body.varCity, req.body.varCountry, req.body.varZip, req.session.user.intUserID, req.params.type],
					function (error, results, fields) {
						if(error)
						{
							console.error(error);

							res.render('cards/card-request-form', {
								request_error: "Failed to insert new request to database",
								params:req.body
							});
							return;
						}
						req.flash('card-message','Request has been sent successfully');
						res.redirect('/card/' + req.params.type);
					});
			}
			else
			{
				res.render('cards/card-request-form', {
					formErrors: formErrors,
					params:req.body
				});
			}
		}
		else
		{
			res.render('cards/card-request-form');
		}
	}, req.session.user.intUserID, req.params.type);
	
};

module.exports = new CardsController();

//setTimeout(module.exports.registerPaidRequests, 5000);
//setTimeout(module.exports.registerPaidRequests, 5000);