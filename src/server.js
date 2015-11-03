/*jslint node: true */
'use strict';

/**
 * Load configuration file given as command line parameter
 */
 if (process.argv.length > 2) {
  console.log('loading configuration file: ' + process.argv[2]);
  var config = require(process.argv[2]);
  if (process.argv.length > 3){
    config.backend = process.argv[3];
  }
}else{
  console.error('no configuration file provided');
  process.exit();
}

/**
 * Module dependencies.
 */

var koa = require('koa');
var logger = require('koa-logger');
var route = require('koa-route');
var nunjucks = require('koa-nunjucks-2');
var path = require('path');
var request = require('superagent');
var thunkify = require('thunkify');
var get = thunkify(request.get);
var markdownParser = require('markdown-it')({breaks: true});

// Open links to new tab.
// https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer

// Remember old renderer, if overriden, or proxy to default renderer
var defaultRender = markdownParser.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

markdownParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target');
  var hrefIndex = tokens[idx].attrIndex('href');
  var hrefString = tokens[idx].attrs[hrefIndex][1];

  if (!hrefString.startsWith('tel:') && !hrefString.startsWith('mailto:')) {
    if (aIndex < 0) {
      tokens[idx].attrPush(['target', '_blank']); // add new attribute
    } else {
      tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
    }
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

var markdownParserContainer = require('markdown-it-container');
markdownParser.use(markdownParserContainer, 'left-align', {render: leftContainerRender});
markdownParser.use(markdownParserContainer, 'right-align', {render: rightContainerRender});
function leftContainerRender(tokens, idx) {
  if (tokens[idx].nesting === 1) {
      // opening tag
      return '<div class="large-5 large-offset-1 left-aligned columns">\n';
    } else {
      // closing tag
      return '</div>\n';
    }
  }
  function rightContainerRender(tokens, idx) {
    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<div class="large-5 columns end person-details">' +
      '<div class="show-for-large-up"><br/><br/></div>\n';
    } else {
      // closing tag
      return '</div>\n';
    }
  }

// setup koa

var app = module.exports = koa();

function getPersonContext() {
  return {
    personQuote: true
  };
}

function getPersonDescription(notes, path) {
  if (notes) {
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].visibility && notes[i].visibility.path === path) {
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

var Data = require('./js/data.js');
var data = new Data();

// route middleware

app.use(route.get('/', index));
app.use(route.get('/palvelut', palvelut));
app.use(route.get('/ihmiset', ihmiset));
app.use(route.get('/tutkimus', tutkimus));
app.use(route.get('/blogi', blogi));

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

// Discontinued, route to front page
app.use(route.get('/ihmiset/assistentti', index));

// backend link

var backendApi, backendInfo;
if (config.backend === true){
  // True value means to use docker provided environment variable
  backendApi = 'http://' + process.env.BACKEND_PORT_8081_TCP_ADDR + ':8081';
}else if (config.backend){
  // Backend API address can also be given with a string directly
  backendApi = config.backend;
  console.log('set backend api: ' + backendApi);
}

var latestInfo;
if (backendApi){
  latestInfo = backendApi + '/public/filosofian-akatemia';
} else {
  console.log('use mock items');
  latestInfo = require('./public.json');
}

if (!config.externalStatic){
  app.use(require('koa-static-folder')('./static'));
}

// routes

function *index() {
  /*jslint validthis: true */
  console.log('GET /');
  this.body = yield this.render('pages/etusivu');
}
function *palvelut() {
  /*jslint validthis: true */
  console.log('GET /palvelut');
  this.body = yield this.render('pages/palvelut');
}
function *ihmiset() {
  /*jslint validthis: true */
  console.log('GET /ihmiset');
  this.body = yield this.render('pages/ihmiset');
}
function *tutkimus() {
  /*jslint validthis: true */
  console.log('GET /tutkimus');
  this.body = yield this.render('pages/tutkimus');
}
function *blogi() {
  /*jslint validthis: true */
  console.log('GET /blogi');
  this.body = yield this.render('pages/blogi');
}

function *aleksej() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/aleksej');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'aleksej-fedotov');
  yield this.render('pages/aleksej', context);
}
function *emilia() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/emilia');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'emilia-lahti');
  yield this.render('pages/emilia', context);
}
function *frank() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/frank');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'frank-martela');
  yield this.render('pages/frank', context);
}
function *iida() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/iida');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'iida-makikallio');
  yield this.render('pages/iida', context);
}
function *joonas() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/joonas');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'joonas-pesonen');
  yield this.render('pages/joonas', context);
}
function *jp() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/jp');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'jukka-pekka-salo');
  yield this.render('pages/jp', context);
}
function *karoliina() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/karoliina');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'karoliina-jarenko');
  yield this.render('pages/karoliina', context);
}
function *lauri() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/lauri');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'lauri-jarvilehto');
  this.body = yield this.render('pages/lauri', context);
}
function *maria() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/maria');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'maria-ruotsalainen');
  yield this.render('pages/maria', context);
}
function *peter() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/peter');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'peter-kentta');
  yield this.render('pages/peter', context);
}
function *reima() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/reima');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'reima-launonen');
  yield this.render('pages/reima', context);
}
function *santeri() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/santeri');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'santeri-laner');
  yield this.render('pages/santeri', context);
}
function *selina() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/selina');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'selina-bakir');
  this.body = yield this.render('pages/selina', context);
}
function *sonja() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/sonja');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'sonja-stromsholm');
  yield this.render('pages/sonja', context);
}
function *tapani() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/tapani');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'tapani-riekki');
  yield this.render('pages/tapani', context);
}
function *timo() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/timo');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'timo-tiuraniemi');
  yield this.render('pages/timo', context);
}
function *villiam() {
  /*jslint validthis: true */
  console.log('GET /ihmiset/villiam');
  var context = getPersonContext();
  var notes = yield data.getLatest(latestInfo);
  context.personDescription = getPersonDescription(notes, 'villiam-virkkunen');
  yield this.render('pages/villiam', context);
}

// get backend /info path from backend on boot

if (backendApi){
  var requestInProgress;
  var backendPollInterval = setInterval(function(){
    if (!requestInProgress){
      requestInProgress = true;
      console.log('GET ' + backendApi + '/info');
      request
        .get(backendApi + '/info')
        .set('Accept', 'application/json')
        .end(function(error, response){
          requestInProgress = false;
          if (response && response.ok){
            backendInfo = response.body;
            console.log('backend info:');
            console.log(JSON.stringify(backendInfo, null, 2));
            clearInterval(backendPollInterval);
          }else{
            console.log('backend returned status code: ' + (error ? error.code : 'unknown') + ', retrying...');
          }
        });
    }
  }, 2000);
}

// listen

app.listen(config.port);
console.log('listening on port ' + config.port);
