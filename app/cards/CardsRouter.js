var cardsController = require('./CardsController.js');
var paymentsController = require('./PaymentsController.js');

function CardsRouter(){
	
}

CardsRouter.prototype.handle = function(app){
	var instance = this;
		
	app.all('/cards*', cardsController.index);
	app.all('/card/:type', cardsController.cardRequest);
	app.all('/pay/:type', cardsController.pay);
	app.all('/coinpayments/ipn', paymentsController.coinPaymentsIpn);
//	app.all('/coinpayments/cancel', paymentsController.coinPaymentsCancel);
	
};

module.exports = new CardsRouter();