/* @var Db mysql */
const mysql = require('../db');
const router = require('./router.js');

function Auth(){
    this.identity   = null;
}

Auth.prototype.getIdentity=function(){
    return this.identity;
};
Auth.prototype.hasIdentity=function(){
    return this.identity != null;
};

Auth.prototype.handle=function(app){
    router.handle(app);
};

var auth = new Auth();


module.exports = auth;