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

var koa = require('koa');
var logger = require('koa-logger');
var route = require('koa-route');
var nunjucks = require('koa-nunjucks-2');
var path = require('path');

// setup koa

var app = module.exports = koa();

// middleware

if (config.debug){
  app.use(logger());
}
if (!config.externalStatic){
  app.use(require('koa-static-folder')('./static'));
}

app.context.render = nunjucks({
  autoescape: true,
  ext: 'nunjucks',
  path: path.join(__dirname, 'views'),
  noCache: config.debug,
  watch: config.debug,
  dev: config.debug
});

// route middleware

app.use(route.get('/', index));
app.use(route.get('/palvelut', palvelut));
app.use(route.get('/ihmiset', ihmiset));
app.use(route.get('/tutkimus', tutkimus));

app.use(route.get('/ihmiset/aleksej', aleksej));

// routes

function *index() {
  console.log("GET /")
  this.body = yield this.render('pages/etusivu');
}
function *palvelut() {
  console.log("GET /palvelut")
  this.body = yield this.render('pages/palvelut');
}
function *ihmiset() {
  console.log("GET /ihmiset")
  this.body = yield this.render('pages/ihmiset');
}
function *tutkimus() {
  console.log("GET /tutkimus")
  this.body = yield this.render('pages/tutkimus');
}

function *aleksej() {
  console.log("GET /ihmiset/aleksej")
  this.body = yield this.render('pages/aleksej');
}

// listen

app.listen(config.port);
console.log('listening on port ' + config.port);
