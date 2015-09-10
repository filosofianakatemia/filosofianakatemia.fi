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
var nativeRequest = require('request');
var thunkify = require('thunkify');
var request = thunkify(nativeRequest);

var notes = require('./notes.json')

var Remarkable = require('remarkable');
var markdownParser = new Remarkable();

// setup koa

var app = module.exports = koa();

function getPersonContext() {
  return {
    personImage: true,
    personQuote: true
  }
}

function getPersonDescription(title) {
  if (notes) {
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].title === title) {
        return markdownParser.render(notes[i].content);
      }
    }
  }
}

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
app.use(route.get('/ihmiset/iida', iida));
app.use(route.get('/ihmiset/joonas', joonas));
app.use(route.get('/ihmiset/jp', jp));
app.use(route.get('/ihmiset/karoliina', karoliina));
app.use(route.get('/ihmiset/lauri', lauri));
app.use(route.get('/ihmiset/maria', maria));
app.use(route.get('/ihmiset/peter', peter));
app.use(route.get('/ihmiset/reima', reima));
app.use(route.get('/ihmiset/santeri', santeri));
app.use(route.get('/ihmiset/selina', selina));
app.use(route.get('/ihmiset/sonja', sonja));
app.use(route.get('/ihmiset/tapani', tapani));
app.use(route.get('/ihmiset/timo', timo));
app.use(route.get('/ihmiset/villiam', villiam));
app.use(route.get('/ihmiset/assistentti', assistant));

// backend link

var backendApi, backendInfo;
if (config.backend === true){
  // True value means to use docker provided environment variable
  backendApi = 'http://' + process.env.BACKEND_PORT_8081_TCP_ADDR + ':8081';
}else if (config.backend){
  // Backend API address can also be given with a string directly
  backendApi = config.backend;
}

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
  console.log("GET /ihmiset/aleksej");
  var context = getPersonContext();
  context.personDescription = getPersonDescription("Aleksej Fedotov");
  yield this.render('pages/aleksej', context);
}
function *emilia() {
  console.log("GET /ihmiset/emilia")
  this.body = yield this.render('pages/emilia', getPersonContext());
}
function *frank() {
  console.log("GET /ihmiset/frank")
  this.body = yield this.render('pages/frank', getPersonContext());
}
function *iida() {
  console.log("GET /ihmiset/iida")
  this.body = yield this.render('pages/iida', getPersonContext());
}
function *joonas() {
  console.log("GET /ihmiset/joonas")
  this.body = yield this.render('pages/joonas', getPersonContext());
}
function *jp() {
  console.log("GET /ihmiset/jp")
  this.body = yield this.render('pages/jp', getPersonContext());
}
function *karoliina() {
  console.log("GET /ihmiset/karoliina")
  this.body = yield this.render('pages/karoliina', getPersonContext());
}
function *lauri() {
  console.log("GET /ihmiset/lauri")
  this.body = yield this.render('pages/lauri', getPersonContext());
}
function *maria() {
  console.log("GET /ihmiset/maria")
  this.body = yield this.render('pages/maria', getPersonContext());
}
function *peter() {
  console.log("GET /ihmiset/peter")
  this.body = yield this.render('pages/peter', getPersonContext());
}
function *reima() {
  console.log("GET /ihmiset/reima")
  this.body = yield this.render('pages/reima', getPersonContext());
}
function *santeri() {
  console.log("GET /ihmiset/santeri")
  this.body = yield this.render('pages/santeri', getPersonContext());
}
function *selina() {
  console.log("GET /ihmiset/selina")
  this.body = yield this.render('pages/selina', getPersonContext());
}
function *sonja() {
  console.log("GET /ihmiset/sonja")
  this.body = yield this.render('pages/sonja', getPersonContext());
}
function *tapani() {
  console.log("GET /ihmiset/tapani")
  this.body = yield this.render('pages/tapani', getPersonContext());
}
function *timo() {
  console.log("GET /ihmiset/timo")
  this.body = yield this.render('pages/timo', getPersonContext());
}
function *villiam() {
  console.log("GET /ihmiset/villiam")
  this.body = yield this.render('pages/villiam', getPersonContext());
}
function *assistant() {
  console.log("GET /ihmiset/assistentti");
  this.body = yield this.render('pages/assistentti');
}

// get backend /info path from backend on boot

if (backendApi){
  var requestInProgress;
  var backendPollInterval = setInterval(function(){
    if (!requestInProgress){
      requestInProgress = true;
      console.log('GET ' + backendApi + '/info')
      nativeRequest(backendApi + '/info', function(error, response, body){
        requestInProgress = false;
        if (!error  && response.statusCode == 200){
          backendInfo = JSON.parse(body);
          console.log('backend info:');
          console.log(JSON.stringify(backendInfo, null, 2));
          clearInterval(backendPollInterval);
        }else{
          console.log('backend returned status code: ' + response.statusCode + ', retrying...');
        }
      });
    }
  }, 2000);
}

// listen

app.listen(config.port);
console.log('listening on port ' + config.port);
