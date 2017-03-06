
/* @constant {Db} db */
const db = require('../db');

var md5 = require('md5');

/**
 * @prop {AuthRouter} router
 */
function AuthController(){
	
}

/**
 * Handle the request for login page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
AuthController.prototype.logout = function(req, res, next) {
	req.session.user = null;
	res.redirect('/');
};
/**
 * Handle the request for login page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
AuthController.prototype.registrer = function(req, res, next) {
	if(req.method === 'POST')
	{
		req.checkBody({
			varName:{
				notEmpty: true,
				errorMessage:"Name is empty"
			},
			varSurname:{
				notEmpty: true,
				errorMessage:"Surname is empty"
			},
			varDob:{
				notEmpty: true,
				errorMessage:"Dob is empty"
			},
			varEmail:{
				isEmail: {
					errorMessage: 'Invalid Email'
				},
				notEmpty: true,
				errorMessage:"Email is empty"
			},
			varPassword: {
				notEmpty: true,
				errorMessage: 'Password is empty'
			},
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
				errorMessage:"Zip is empty",
				isLength: {
					options: [{ min: 3, max: 16 }],
					errorMessage: 'Must be between 3 and 16 digits long' // Error message for the validator, takes precedent over parameter message
				},
			},
			varLng:{
				notEmpty: true,
				errorMessage:"Language is empty"
			},
			varPhoneCountry:{
				notEmpty: true,
				errorMessage:"Phone country is empty"
			},
			varPhone:{
				notEmpty: true,
				errorMessage:"Phone is empty"
			},
			varPhonePass:{
				notEmpty: true,
				isLength: {
					options: [{ min: 8, max: 255 }],
					errorMessage: 'Must be between 8 and 255 chars long' // Error message for the validator, takes precedent over parameter message
				},
				errorMessage:"Phone pssword is empty"
			},
			
			confirm:{
				notEmpty: true,
				errorMessage:"You should agree terms of use"
			}
		});
		
		var formErrors = req.validationErrors(true);
		
		if(!formErrors)
		{
			db.query('SELECT * FROM `user` WHERE `varEmail` = ?',
				[req.body.varEmail],
				function (error, results, fields) {
					if(error)
					{
						console.error(error);
						res.render('auth/register', {
							params:req.body,
							register_errors:"Databse error"
						});
						
						return;
					}
					
					if(results.length > 0)
					{
						res.render('auth/register', {
							params:req.body,
							register_errors:"Email already used"
						});
						return;
					}
					var varPassword = md5(req.body.varPassword);
					db.query('insert into `user` (`varEmail`, `varPassword`,`varName`, `varSurname`, `varDob`, `varAddress`, `varCity` , `varCountry`, `varZip`,`varLng`,`varPhoneCountry`,`varPhone`,`varPhonePass` ) values(?,?,?,?,?,?,?,?,?,?,?,?,?)',
						[req.body.varEmail,
							varPassword,
							req.body.varName,
							req.body.varSurname,
							req.body.varDob,
							req.body.varAddress,
							req.body.varCity,
							req.body.varCountry,
							req.body.varZip,
							req.body.varLng,
							req.body.varPhoneCountry,
							req.body.varPhone,
							req.body.varPhonePass],
						function (error, results, fields) {
							if(error)
							{
								console.error(error);

								req.flash('register_errors',"Failed to insert new user to database");
								res.redirect('/register');
								return;
							}
							req.session.user = {
								varEmail: req.body.varEmail,
								varPassword: varPassword,
								intUserID: results.insertId,
								varName:req.body.varName,
								varSurname:req.body.varSurname,
								varDob:req.body.varDob,
								varAddress:req.body.varAddress,
								varCity:req.body.varCity,
								varCountry:req.body.varCountry,
								varZip:req.body.varZip,
								varLng:req.body.varLng,
								varPhoneCountry:req.body.varPhoneCountry,
								varPhone:req.body.varPhone,
								varPhonePass:req.body.varPhonePass
							};
							var redirect = req.flash('redirect');
							res.redirect(redirect.length > 0 ? redirect[0] : '/cards');
						});
			});
			//getUser(req.body.varEmail, req.body.varPassword);
			//console.log('login done');
		}
		else{
			res.render('auth/register', {
				formErrors: formErrors,
				params:req.body
			});
		}
	}
	else
	{
		res.render('auth/register');
	}
};
/**
 * Handle the request for login page.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 */
AuthController.prototype.login = function(req, res, next) {
	if(req.method === 'POST')
	{
		req.checkBody({
			varEmail:{
				isEmail: {
					errorMessage: 'Invalid Email'
				},
				notEmpty: true,
				errorMessage:"Email is empty"
			},
			varPassword: {
				notEmpty: true,
				errorMessage: 'Password is empty'
			}
			
		});
		
		var formErros = req.validationErrors(true);

		if(!formErros)
		{
			db.query(
				'SELECT * FROM `user` WHERE `varEmail` = ? and `varPassword` = ?',
				[req.body.varEmail, md5(req.body.varPassword)],
				function (error, results, fields) {
					if(error)
					{
						console.error(error);
						
						req.flash('login_errors',"Databse error");
						res.redirect('/login');
						return;
					}
					
					if(results.length == 0)
					{
						req.flash('login_errors',"User not found");
						res.redirect('/login');
						return;
					}
					var user = {};
					for(var i = 0; i < fields.length; i++)
					{
						user[fields[i].name] = results[0][fields[i].name];
					}
					
					req.session.user = user;
					
					var redirect = req.flash('redirect');
					res.redirect(redirect.length > 0 ? redirect[0] : '/cards');
			});
			//getUser(req.body.varEmail, req.body.varPassword);
			//console.log('login done');
		}
		else{
			res.render('auth/login', {
				formErros: formErros,
				params:req.body
			});
		}
	}
	else
	{
		res.render('auth/login', {
			page: 'login',
			login_errors: req.flash('login_errors')
		});
	}
};

module.exports = new AuthController();