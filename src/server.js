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
app.use(route.get('/ihmiset/emilia', emilia));
app.use(route.get('/ihmiset/frank', frank));
app.use(route.get('/ihmiset/joonas', joonas));
app.use(route.get('/ihmiset/jp', jp));
app.use(route.get('/ihmiset/karoliina', karoliina));
app.use(route.get('/ihmiset/lauri', lauri));
app.use(route.get('/ihmiset/maria', maria));
app.use(route.get('/ihmiset/peter', peter));
app.use(route.get('/ihmiset/reima', reima));
app.use(route.get('/ihmiset/santeri', santeri));
app.use(route.get('/ihmiset/sonja', sonja));
app.use(route.get('/ihmiset/tapani', tapani));
app.use(route.get('/ihmiset/timo', timo));
app.use(route.get('/ihmiset/villiam', villiam));
app.use(route.get('/ihmiset/iida', iida));
app.use(route.get('/ihmiset/selina', selina));

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
function *emilia() {
  console.log("GET /ihmiset/emilia")
  this.body = yield this.render('pages/emilia');
}
function *frank() {
  console.log("GET /ihmiset/frank")
  this.body = yield this.render('pages/frank');
}
function *joonas() {
  console.log("GET /ihmiset/joonas")
  this.body = yield this.render('pages/joonas');
}
function *jp() {
  console.log("GET /ihmiset/jp")
  this.body = yield this.render('pages/jp');
}
function *karoliina() {
  console.log("GET /ihmiset/karoliina")
  this.body = yield this.render('pages/karoliina');
}
function *lauri() {
  console.log("GET /ihmiset/lauri")
  this.body = yield this.render('pages/lauri');
}
function *maria() {
  console.log("GET /ihmiset/maria")
  this.body = yield this.render('pages/maria');
}
function *peter() {
  console.log("GET /ihmiset/peter")
  this.body = yield this.render('pages/peter');
}
function *reima() {
  console.log("GET /ihmiset/reima")
  this.body = yield this.render('pages/reima');
}
function *santeri() {
  console.log("GET /ihmiset/santeri")
  this.body = yield this.render('pages/santeri');
}
function *sonja() {
  console.log("GET /ihmiset/sonja")
  this.body = yield this.render('pages/sonja');
}
function *tapani() {
  console.log("GET /ihmiset/tapani")
  this.body = yield this.render('pages/tapani');
}
function *timo() {
  console.log("GET /ihmiset/timo")
  this.body = yield this.render('pages/timo');
}
function *villiam() {
  console.log("GET /ihmiset/villiam")
  this.body = yield this.render('pages/villiam');
}
function *iida() {
  console.log("GET /ihmiset/iida")
  this.body = yield this.render('pages/iida');
}
function *selina() {
  console.log("GET /ihmiset/selina")
  this.body = yield this.render('pages/selina');
}

// listen

app.listen(config.port);
console.log('listening on port ' + config.port);
