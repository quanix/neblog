
//加载模块
var express = require('express');
//mongo session
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//加载路由文件夹下的相关文件
var routes = require('./routes');
//应用设定
var settings = require('./settings');

var multer = require('multer');

//创建express实例
var app = express();

//设置服务端口
app.set('port', process.env.PORT || 3000);
//设置视图文件夹
app.set('views', path.join(__dirname, 'views'));
//设置视图引擎
app.set('view engine', 'ejs');

//使用服务
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//保留上传文件的后缀名,并把上传目录设置为 /public/images/
app.use(multer({dest: "./public/images"}))

app.use(bodyParser({ keepExtensions: true, uploadDir: './public/images' }));
app.use(cookieParser());
app.use(flash());
app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,//cookie name
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
    store: new MongoStore({
        db: settings.db,
        host:settings.host,
        port:settings.port
    })
}));
//设置公共目录,放css ,images 的文件夹
app.use(express.static(path.join(__dirname, 'public')));


/** 通过htpp 创建web 服务 , 监听端口为 port  **/
http.createServer(app).listen(app.get('port'), function(){
    console.log('服务已经运行,端口为: ' + app.get('port'));
});

//模块输出
routes(app);
