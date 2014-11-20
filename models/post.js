var mongodb = require('./db');
var markdown = require('markdown').markdown;

/** 文章实体 **/
function Post(name,title,tags,post) {
    this.name = name;
    this.title = title;
    this.tags = tags;
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
        tags: this.tags,
        post : this.post,
        comments : [],
        pv:0
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

    //打开数据库
    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        //读取数据库集合
        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            //查询条件
            var query = {};
            if(name) {
                query.name = name;
            }

            //使用 count 返回特定查询的文档数
            collection.count(query,function(err,total) {
                //根据query对象查询,并跳过前 (page - 1)*10个结果
                collection.find(query,{
                    skip : (page-1)*10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function(err,docs) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    
                    //解析 markdown 为 html
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null,docs,total);
                });
            });
        });
    });
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
                if(err) {
                    mongodb.close();
                    return callback(err);
                }

                if(doc) {
                    //每访问 1 次，pv 值增加 1
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $inc :{"pv":1}
                    },function(err) {
                        mongodb.close();
                        if(err) {
                            return callback(err);
                        }
                    });

                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null,doc);//返回查询的一篇文章
                }
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

    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        //读取posts集合
        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};


//返回所有标签
Post.getTags = function(callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询所有 tags 数组内包含 tag 的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


//返回通过关键字查询的所有文章
Post.search = function(keyword,callback) {

    mongodb.open(function(err,db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts',function(err,collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({ $or :[
                {"title":pattern},
                {"post":pattern}
            ]
            },{
                "name": 1,
                "time": 1,
                "title": 1,
                "post":1
            }).sort({
                time:-1
            }).toArray(function(err,docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};


//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {

};