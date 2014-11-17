var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

//建立MongoDB的数据库连接
module.exports = new Db(settings.db,new Server(settings.host,settings.port),{safe:true});
