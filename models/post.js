var mongodb = require('./db');
var markdown = require('markdown').markdown;

/** 文章实体 **/
function Post(name,title,post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post;

//存储一篇文章和它的相关信息
Post.prototype.save = function(callback) {

    var date = new Date();
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }

    var post = {
        name : this.name,
        time : time,
        title: this.title,
        post : this.post
    }

    //打开数据库
    mongodb.open(function(err,db) {
        if(err) {
            mongodb.close();
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(post,{
                safe :true
            },function(err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null);
            });
        });

    });
};


//获取文章
Post.get = function(name,callback) {

    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            //构造查询条件
            var query = {};
            if(name) {
                query.name = name;
            }

            collection.find(query).sort({
                time : -1
            }).toArray(function(err,docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                //增加Markdown的支持
                docs.forEach(function(doc) {
                    doc.post = markdown.toHTML(doc.post);
                });

                callback(null,docs);
            });

        });
    });
};


//获取10篇文章
Post.getTen = function(name,page,callback) {

};


//获取一篇文章
Post.getOne = function(name,day,title,callback) {

    //打开数据库
    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //获取一行记录
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                doc.post = markdown.toHTML(doc.post);
                callback(null,doc);//返回查询的一篇文章
            });
        });
    });
};


//返回原始发表的内容
Post.edit = function(name,day,title,callback) {

    //打开数据库
    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null,doc);
            });
        });
    });
};


//更新一篇文章已经相关信息
Post.update = function(name,day,title,post,callback) {
    //打开数据库
    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            },{
                $set:{post:post}
            },function(err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });

        });
    });
};


//移除一篇文章
Post.remove = function(name,day,title,callback) {
    //打开数据
    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{
                w:1
            },function(err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};


//返回所有文章存档信息
Post.getArchive = function(callback) {

};


//返回所有标签
Post.getTags = function (callback) {

};


//返回含有特地标签的所有文章
Post.getTag = function(callback) {

};


//返回通过关键字查询的所有文章
Post.search = function(keyword,callback) {

};


//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {

};