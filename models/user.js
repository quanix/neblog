var mongodb = require('./db');
var crypto = require('crypto');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

    //要存入数据库的用户信息文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    }

    //打开数据库
    mongodb.open(function(err,db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }

        db.collection('users',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            //将用户数据插入 users 集合中
            collection.insert(user,{
                safe:true
            },function(err,user) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null,user[0]);//成功！err 为 null，并返回存储后的用户文档
            });
        });
    });
};


//读取数据库
User.get = function(name, callback) {
    //打开数据库
    mongodb.open(function(err, db) {
        //失败,返回错误信息
        if(err){
            return callback(err);
        }
        //读取 users 集合
        db.collection('users',function(err,collection) {
            //失败,返回错误信息
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名查找一个文档
            collection.findOne({
                name:name
            }, function(err,user) {
                //失败,返回错误信息
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                //成功,返回用户信息
                callback(null,user);
            });
        });
    });
}


