
var controller = require('./AuthController.js');

/* @var controller AuthController */

/**
 * Auth router
 * 
 * @property {Auth} auth Auth service
 */
function AuthRouter(config){
	this.authRoutes = [];
	this.whitelist = ['/login','/register','/logout'];
	if(config instanceof Object)
	{
		this.authRoutes = config.authRoutes || this.authRoutes;
		this.whitelist = this.whitelist.concat(config.whitelist||[]);
		console.log('authRoutes', this.authRoutes);
		console.log('whitelist', this.whitelist);
	}
	
};
/**
 * 
 * @param {string} route
 * @returns {Boolean}
 */
AuthRouter.prototype.needAuth = function(route){
	if(this.whitelist.indexOf(route) >= 0)
		return false;
	
	for(var i=0; i < this.authRoutes.length; i++)
	{
		if(typeof this.whitelist[i] === "string" && route === this.whitelist[i])
		{
			return true;
		}
		else if(this.authRoutes[i].constructor.name === "RegExp" && route.match(this.authRoutes[i]))
		{
			return true;
		}
	}
	
	return false;
};

AuthRouter.prototype.handle = function(app){
	var instance = this;
	app.use(function(req, res, next) {
		
		if(instance.needAuth(req.path) && !req.session.user)
		{
			req.flash('redirect');
			req.flash('redirect', req.url);
			
			res.redirect('/login');
			return;
		}

		next();
	});
	
	app.all('/logout', controller.logout);
	app.all('/login', controller.login);
	app.all('/register', controller.registrer);
};

const config = require('../../constants.js');

const router = new AuthRouter(config.auth || null);

module.exports = router;