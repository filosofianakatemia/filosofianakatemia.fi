/**
 * Load configuration file given as command line parameter
 */
if (process.argv.length > 2) {
  console.log('loading configuration file: ' + process.argv[2]);
  var config = require(process.argv[2]);
}else{
  console.error('no configuration file provided');
  process.exit();
};

/**
 * Module dependencies.
 */

var views = require('co-views');
var koa = require('koa');
var logger = require('koa-logger');
var route = require('koa-route');

// main

var app = module.exports = koa();
var render = views(__dirname + '/views', { ext: 'nunjucks' });

// middleware

app.use(logger());
if (!config.externalStatic){
  app.use(require('koa-static-folder')('./static'));
}

// route middleware

app.use(route.get('/', index));
app.use(route.get('/palvelut', palvelut));
app.use(route.get('/ihmiset', ihmiset));
app.use(route.get('/tutkimus', tutkimus));

// routes

function *index() {
  this.body = yield render('pages/etusivu');
}
function *palvelut() {
  this.body = yield render('pages/palvelut');
}
function *ihmiset() {
  this.body = yield render('pages/ihmiset');
}
function *tutkimus() {
  this.body = yield render('pages/tutkimus');
}

// listen

app.listen(config.port);
console.log('listening on port ' + config.port);
