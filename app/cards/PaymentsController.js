const db = require('../db');

var coinPayConf = require('../conf/coinpayments.json');

var coinPay = require('coinpayments');
var client = new coinPay(coinPayConf.auth);

var ipnFields = [
	'status',
	'status_text',
	'txn_id',
	'currency1',
	'currency2',
	'amount1',
	'amount2',
	'fee',
	'buyer_name',
	'item_name',
	'invoice',
	'received_amount',
	'received_confirms'
];

module.exports.coinPaymentsIpn = function(req, res, next){
	console.log('coinPaymentsIpn', req.headers, req.body);
	
	var sqlFilds = ipnFields.join(', ');
	var bindVars = [
		JSON.stringify(req.headers),
		JSON.stringify(req.body)
	];
	
	ipnFields.forEach(function(field){
		bindVars.push(req.body.hasOwnProperty(field) ? req.body[field] : null);
	});
	
	var bindSqlStr = ipnFields.slice().fill('?').join(',');
	
	db.query('insert into `ipn` (`varHeaders`, `varBody`, '+ sqlFilds+') values(?,?,'+ bindSqlStr + ')',
		bindVars,
		function (error, results, fields) {
			if(error)
			{
				console.error("ipn db save failed" , error);
				res.end();
				return;
			}
			
			client.getTx(req.body.txn_id,function(err, transactionFromApi){
				if(err)
				{
					console.error("ipn transaction select failed" , err);
					res.end();
					return;
				}
				db.query('select * from coin_payment_transaction where txn_id = ?',
					[req.body.txn_id],
					function (error, transactFromDb, fields) {
						if(error)
						{
							console.error("ipn db transaction get failed" , error);
							res.end();
							return;
						}
						if(!transactFromDb || transactFromDb.length == 0)
						{
							console.log('ipn transaction %s not found', req.body.txn_id);
							res.end();
							return;
						}
						
						var newStatus = '', need = parseFloat(transactFromDb[0].amount), receve = parseFloat(transactionFromApi.amountf);
						
						if(transactionFromApi.status >= 100 && receve >= need)
						{
							newStatus = 'paid';
						}
						else if(transactionFromApi.status >= 100 && receve < need)
						{
							newStatus = 'error';
						}
						else
						{
							res.end();
							return;
						}
						
						db.query('update card_request set varStatus = ? where intRequestID = ? and varStatus = ?',
							[newStatus, transactFromDb[0].intRequestID, 'wait'],
								function (error) {
									if(error)
									{
										console.error("ipn update card_request failed:" , error);
									}
									res.end();
								});
						
					});	
			});
		});
};