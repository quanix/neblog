var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');


//模块输出
module.exports = function(app) {

  /** 默认访问路径  **/
  app.get('/',function(req,res) {

    Post.get(null,function(err,posts) {
      if(err) {
        posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts:posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  /** 注册页面 GET **/
  app.get('/reg', checkNotLogin);
  app.get('/reg',function(req,res) {
    res.render('reg',{
      title:'注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  /** 注册页面 POST **/
  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res) {
    var name = req.body.name;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];

    //检验密码
    if(password == '') {
      req.flash('error','密码不能为空');
      return res.redirect('/reg');
    }

    if(password != password_re) {
      req.flash('error','两次输入的密码不一致');
      return res.redirect('/reg');
    }

    //生成密码的MD5
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('hex');

    //新建用户对象
    var newUser = new User({
      name:name,
      password:password,
      email:req.body.email
    });

    //根据用户名检查用户在数据库中是否存在
    User.get(newUser.name , function(err,user) {
      if(user) {
        req.flash('error', '用户已存在!');
        return res.redirect('/reg');//返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err,user) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = user;
        req.flash('success','注册成功');
        res.redirect('/');
      });
    });
  });


  /** 登陆页面 GET **/
  app.get('/login',checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login',{
      title:'登陆',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });


  /** 登陆页面 POST **/
  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');

    //检查用户是否存在
    User.get(req.body.name,function(err,user) {
      if(!user) {
        req.flash('error','用户不存在!');
        return res.redirect('/login');
      }

      //检查密码是否一致
      if(user.password != password) {
        req.flash('error','密码错误!');
        return res.redirect('/login');//密码错误则跳转到登陆页
      }

      //用户名密码都匹配后,将用户信息存入 session
      req.session.user = user;
      req.flash('success','登陆成功!');
      res.redirect('/');
    });
  });


  /** 登出 **/
  app.get('/logout',checkLogin);
  app.get('/logout',function(req,res) {
    req.session.user = null;
    req.flash('success','登出成功');
    res.redirect('/');
  });



  /** 发表 GET **/
  app.get('/post',checkLogin);
  app.get('/post',function(req,res) {
    res.render('post',{
      title : '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });


  /** 发表 POST **/
  app.post('/post',checkLogin);
  app.post('/post',function(req,res) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name,req.body.title,req.body.post);
    //保存
    post.save(function(err) {
      if(err) {
        req.flash('error',err);
        return res.redirect('/');
      }

      req.flash('success','发布成功!');
      res.redirect('/');//发表成功跳转到主页
    });
  });


  /** 上传功能 **/
  app.get('/upload',checkLogin);
  app.get('/upload',function(req,res) {
    res.render('upload',{
      title:'文件上传',
      user:req.session.user,
      success: req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });

  /**
   * 上传 POST
   */
  app.post("/upload",checkLogin);
  app.post("/upload", function (req,res) {
    for(var i in req.files) {
      if(req.files[i].size == 0) {
        fs.unlinkSync(req.files[i].path);
        console.log('Successfully removed an empty file !');
      }else {
        var target_path = './public/images/'+req.files[i].name;
        //使用同步方式重命名一个文件
        fs.renameSync(req.files[i].path,target_path);
        console.log('Successfully renamed a file !');
      }
    }
    req.flash('success','文件上传成功');
    res.redirect('/upload');
  });



  app.get('/u/:name',function(req, res) {
    User.get(req.params.name, function(err,user) {
      if(!user) {
        req.flash('error','用户不存在!');
        return res.redirect('/');
      }

      //查询并返回该用户的所有文章
      Post.get(user.name,function(err,posts) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/');
        }

        res.redirect('user',{
          title: user.name,
          posts: posts,
          user : req.session.user,
          success : req.flash('success').toString(),
          error : req.flash('error').toString()
        });
      });
    });
  });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });


  /**
   *  修改文章
   */
  app.get('/edit/:name/:day/:title',checkLogin);
  app.get('/edit/:name/:day/:title',function(req,res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post) {
      if(err) {
        req.flash('error',err);
        return res.redirect('back');
      }

      res.render('edit',{
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });


  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
      if (err) {
        req.flash('error', err);
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    });
  });

  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });


  /** 友情链接 **/
  app.get('/links',function(req,res) {
    res.render('links', {
      title:'友情链接',
      user:req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });


  /** 页面没有找到 **/
  app.use(function (req,res) {
    res.render(404);
  });


  /** 检查是否登陆 **/
  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!');
      res.redirect('/login');
    }
    next();
  }

  /** 检查是否没有登陆 **/
  function checkNotLogin(req,res,next) {
    if(req.session.user) {
      req.flash('error','已登陆');
      res.redirect('back');//返回之前的页面
    }
    next();
  }

};