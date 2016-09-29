/*jslint node: true */
'use strict';

const siteutils = require('../node_modules/extendedmind-siteutils/transpile/index.js');
const route = require('koa-route');
const path = require('path');
const request = require('superagent-promise')(require('superagent'), Promise);
const markdownParser = require('markdown-it')({breaks: true, linkify: true});
const jsdom = require('jsdom').jsdom;

module.exports = (config, app, backendApi) => {

  var settings = config.debug ? {syncTimeTreshold: 5000} : undefined;
  const backendClient = siteutils.extendedmind(backendApi, settings);

  // CONFIGURE NUNJUCKS

  const nunjucks = siteutils.koaNunjucks({
    autoescape: true,
    ext: 'nunjucks',
    path: path.join(__dirname, '../views'),
    noCache: config.debug,
    watch: config.debug,
    dev: config.debug
  });
  nunjucks.env.addGlobal('development', config.debug);
  nunjucks.env.addFilter('d.M.yyyy', function(timestamp) {
    // http://stackoverflow.com/a/3552493
    // https://docs.angularjs.org/api/ng/filter/date
    let date = new Date(timestamp);
    return date.getDate() + '.' + (1 + date.getMonth()) + '.' + date.getFullYear();
  });
  const render = nunjucks.render;

  // CONFIGURE MARKDOWN

  // Open links to new tab.
  // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer

  // Remember old renderer, if overriden, or proxy to default renderer
  var defaultRender = markdownParser.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  markdownParser.renderer.rules.blockquote_close  = function() {
    return '<span class="icon-quote"><span></blockquote>';
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

  // Youtube (and non-tested Vimeo)

  // The youtube_parser is from http://stackoverflow.com/a/8260383
  function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
      return match[7];
    } else{
      return url;
    }
  }

  // The vimeo_parser is from http://stackoverflow.com/a/13286930
  function vimeo_parser(url){
    var regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    var match = url.match(regExp);
    if (match){
      return match[3];
    } else{
      return url;
    }
  }

  function video_embed(md) {
    function video_return(state, silent) {
      var code,
          serviceEnd,
          serviceStart,
          pos,
          res,
          videoID = '',
          tokens,
          token,
          start,
          oldPos = state.pos,
          max = state.posMax;

      // When we add more services, (youtube) might be (youtube|vimeo|vine), for example
      var EMBED_REGEX = /@\[(youtube|vimeo)\]\([\s]*(.*?)[\s]*[\)]/im;


      if (state.src.charCodeAt(state.pos) !== 0x40/* @ */) {
        return false;
      }
      if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) {
        return false;
      }

      var match = EMBED_REGEX.exec(state.src);

      if(!match){
        return false;
      }

      if (match.length < 3){
        return false;
      }


      var service = match[1];
      var videoID = match[2];
      if (service.toLowerCase() == 'youtube') {
        videoID = youtube_parser(videoID);
      } else if (service.toLowerCase() == 'vimeo') {
        videoID = vimeo_parser(videoID);
      }

      // If the videoID field is empty, regex currently make it the close parenthesis.
      if (videoID === ')') {
        videoID = '';
      }

      serviceStart = state.pos + 2;
      serviceEnd = md.helpers.parseLinkLabel(state, state.pos + 1, false);

      //
      // We found the end of the link, and know for a fact it's a valid link;
      // so all that's left to do is to call tokenizer.
      //
      if (!silent) {
        state.pos = serviceStart;
        state.posMax = serviceEnd;
        state.service = state.src.slice(serviceStart, serviceEnd);
        var newState = new state.md.inline.State(
          service,
          state.md,
          state.env,
          tokens = []
        );
        newState.md.inline.tokenize(newState);

        token = state.push('video', '');
        token.videoID = videoID;
        token.service = service;
        token.level = state.level;
      }

      state.pos = state.pos + state.src.indexOf(')');
      state.posMax = state.tokens.length;
      return true;
    }

    return video_return;
  }

  function tokenize_youtube(videoID) {
    var embedStart = '<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" id="ytplayer" type="text/html" width="640" height="390" src="//www.youtube.com/embed/';
    var embedEnd = '" frameborder="0"></iframe></div>';
    return embedStart + videoID + embedEnd;
  }

  function tokenize_vimeo(videoID) {
    var embedStart = '<div class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" id="vimeoplayer" width="500" height="281" src="//player.vimeo.com/video/';
    var embedEnd = '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
    return embedStart + videoID + embedEnd;
  }

  function tokenize_video(md) {
    function tokenize_return(tokens, idx, options, env, self) {
        var videoID = md.utils.escapeHtml(tokens[idx].videoID);
        var service = md.utils.escapeHtml(tokens[idx].service);
        if (videoID === '') {
            return '';
        }

      if (service.toLowerCase() === 'youtube') {
        return tokenize_youtube(videoID);
      } else if (service.toLowerCase() === 'vimeo') {
          return tokenize_vimeo(videoID);
      } else{
         return('');
      }

    }

    return tokenize_return;
  }
  markdownParser.renderer.rules.video = tokenize_video(markdownParser);
  markdownParser.inline.ruler.before('emphasis', 'video', video_embed(markdownParser));

  // ROUTE MIDDLEWARE

  function index(ctx) {
    console.log('GET /');
    ctx.body = render('pages/etusivu');
  }
  function palvelut(ctx) {
    console.log('GET /palvelut');
    ctx.body = render('pages/palvelut');
  }
  function sisaisenMotivaationJohtaminen(ctx) {
    console.log('GET /palvelut/sisaisen-motivaation-johtaminen');
    ctx.body = render('pages/sisaisenmotivaationjohtaminen');
  }
  function mielensavalottajat(ctx) {
    console.log('GET /palvelut/mielensavalottajat');
    ctx.body = render('pages/mielensavalottajat');
  }
  function ihmiset(ctx) {
    console.log('GET /ihmiset');
    ctx.body = render('pages/ihmiset');
  }
  function tutkimus(ctx) {
    console.log('GET /tutkimus');
    ctx.body = render('pages/tutkimus');
  }

  async function generateBlogsContext() { // jshint ignore:line
    let unrenderedBlogs = await getUnrenderedBlogs(); // jshint ignore:line
    let renderedBlogs = generateBlogs(unrenderedBlogs.slice(0, 5));
    let context = {
      blogs: renderedBlogs,
      firstPage: true
    };
    if (unrenderedBlogs.length <= 5) {
      context.lastPage = true;
    } else {
      context.nextPageNumber = 2;
    }
    return context;
  }

  async function blogi(ctx) { // jshint ignore:line
    console.log('GET /blogi');
    let context = await generateBlogsContext(); // jshint ignore:line
    if (context) {
      ctx.body = render('pages/blogi', context);
    }
  }

  async function generateBlogsArchivePageContext(number) {  // jshint ignore:line
    // Pages #2...#n.
    let unrenderedBlogs = await getUnrenderedBlogs(); // jshint ignore:line
    const sliceStartIndex = 5 * (number-1);
    if (sliceStartIndex < unrenderedBlogs.length) {
      // There are blog posts left for the given page number.
      let renderedBlogs = generateBlogs(unrenderedBlogs.slice(sliceStartIndex, sliceStartIndex+5));
      let context = {
        blogs: renderedBlogs,
        previousPageNumber: number - 1
      };
      if (sliceStartIndex + 5 < unrenderedBlogs.length){
        // There is also a next page
        context.nextPageNumber = number + 1;
      }else{
        context.lastPage = true;
      }
      return context;
    }
  }

  async function blogiSivu(ctx, number) { // jshint ignore:line
    console.log('GET /blogi/sivu/' + number);
    if (number && !isNaN(number)) {
      number = parseInt(number);
      if (number === 0 || number === 1) {
        // Redirect to the first page.
        ctx.redirect('/blogi');
      } else {
        let context = await generateBlogsArchivePageContext(number);  // jshint ignore:line
        if (context) {
          ctx.body = render('pages/blogi', context);
        }
      }
    }
  }

  async function blogiLukutila(ctx, number) { // jshint ignore:line
    console.log('GET /blogi/lukutila/sivu/' + number);
    if (number && !isNaN(number)) {
      let context;
      number = parseInt(number);
      if (number === 0) {
        // Redirect to the first page.
        ctx.redirect('/blogi/lukutila/sivu/1');
      } else if (number === 1) {
        // Render the first page.
        context = await generateBlogsContext(); // jshint ignore:line
      } else {
        context = await generateBlogsArchivePageContext(number);  // jshint ignore:line
      }
      if (context) {
        context.readMode = true;
        ctx.body = render('pages/blogi', context);
      }
    }
  }

  async function blogiTeksti(ctx, path) { // jshint ignore:line
    console.log('GET /blogi/' + path);
    let faPublicItems = await backendClient.getPublicItems('filosofian-akatemia');  // jshint ignore:line
    let blogPosts = filterBlogsFromPublicItems(faPublicItems);
    let blogPost;
    for (let i = 0; i < blogPosts.length; i++) {
      if (blogPosts[i].visibility && blogPosts[i].visibility.path === path) {
        blogPost = blogPosts[i];
        break;
      }
    }
    if (blogPost) {
      renderBlogPost(ctx, faPublicItems, blogPost);
    }
  }

  async function esikatselu(ctx, ownerUUID, itemUUID, previewCode) {
    console.log('GET /esikatselu/' + ownerUUID + '/' + itemUUID + '/' + previewCode);
    let previewResponse = await backendClient.getPreviewItem(ownerUUID, itemUUID, previewCode);
    var note = previewResponse.note;
    // Render page based on preview note keywords
    let faPublicItems = await backendClient.getPublicItems('filosofian-akatemia');
    faPublicItems.addKeywordsToExternalNote(note);
    if (note.keywords && note.keywords.length){
      for (let i=0; i<note.keywords.length; i++){
        if (note.keywords[i].title === 'blogi'){
          renderBlogPost(ctx, faPublicItems, note);
          break;
        }
      }
    }
  }

  async function emilia(ctx) {
    console.log('GET /ihmiset/emilia');
    const personContext = await getPersonContext('emilia-lahti');
    ctx.body = render('pages/emilia', personContext);
  }
  async function frank(ctx) {
    console.log('GET /ihmiset/frank');
    const personContext = await getPersonContext('frank-martela');
    ctx.body = render('pages/frank', personContext);
  }
  async function iida(ctx) {
    console.log('GET /ihmiset/iida');
    const personContext = await getPersonContext('iida-makikallio');
    ctx.body = render('pages/iida', personContext);
  }
  async function joonas(ctx) {
    console.log('GET /ihmiset/joonas');
    const personContext = await getPersonContext('joonas-pesonen');
    ctx.body = render('pages/joonas', personContext);
  }
  async function jp(ctx) {
    console.log('GET /ihmiset/jp');
    const personContext = await getPersonContext('jukka-pekka-salo');
    ctx.body = render('pages/jp', personContext);
  }
  async function karoliina(ctx) {
    console.log('GET /ihmiset/karoliina');
    const personContext = await getPersonContext('karoliina-jarenko');
    ctx.body = render('pages/karoliina', personContext);
  }
  async function lauri(ctx) {
    console.log('GET /ihmiset/lauri');
    const personContext = await getPersonContext('lauri-jarvilehto');
    ctx.body = render('pages/lauri', personContext);
  }
  async function maria(ctx) {
    console.log('GET /ihmiset/maria');
    const personContext = await getPersonContext('maria-ruotsalainen');
    ctx.body = render('pages/maria', personContext);
  }
  async function peter(ctx) {
    console.log('GET /ihmiset/peter');
    const personContext = await getPersonContext('peter-kentta');
    ctx.body = render('pages/peter', personContext);
  }
  async function reima(ctx) {
    console.log('GET /ihmiset/reima');
    const personContext = await getPersonContext('reima-launonen');
    ctx.body = render('pages/reima', personContext);
  }
  async function sami(ctx) {
    console.log('GET /ihmiset/sami');
    const personContext = await getPersonContext('sami-paju');
    ctx.body = render('pages/sami', personContext);
  }
  async function santeri(ctx) {
    console.log('GET /ihmiset/santeri');
    const personContext = await getPersonContext('santeri-laner');
    ctx.body = render('pages/santeri', personContext);
  }
  async function selina(ctx) {
    console.log('GET /ihmiset/selina');
    const personContext = await getPersonContext('selina-bakir');
    ctx.body = render('pages/selina', personContext);
  }
  async function sonja(ctx) {
    console.log('GET /ihmiset/sonja');
    const personContext = await getPersonContext('sonja-stromsholm');
    ctx.body = render('pages/sonja', personContext);
  }
  async function tapani(ctx) {
    console.log('GET /ihmiset/tapani');
    const personContext = await getPersonContext('tapani-riekki');
    ctx.body = render('pages/tapani', personContext);
  }
  async function timo(ctx) {
    console.log('GET /ihmiset/timo');
    const personContext = await getPersonContext('timo-tiuraniemi');
    ctx.body = render('pages/timo', personContext);
  }
  async function villiam(ctx) {
    console.log('GET /ihmiset/villiam');
    const personContext = await getPersonContext('villiam-virkkunen');
    ctx.body = render('pages/villiam', personContext);
  }
  async function santeriEsittely(ctx) {
    console.log('GET /ihmiset/santeri/esittely');
    ctx.body = render('pages/esittely');
  }
  async function santeriSisainenMotivaatio(ctx) {
    console.log('GET /ihmiset/santeri/sisainen-motivaatio');
    ctx.body = render('pages/sisainenmotivaatio');
  }
  async function robots(ctx) {
    console.log('GET /robots.txt');
    let robotsTxt = 'User-agent: *\n' +
                    'Disallow: /ihmiset/santeri/esittely';
    ctx.body = robotsTxt;
  }

  app.use(route.get('/', index));
  app.use(route.get('/palvelut', palvelut));
  app.use(route.get('/palvelut/sisaisen-motivaation-johtaminen', sisaisenMotivaationJohtaminen));
  app.use(route.get('/palvelut/mielensavalottajat', mielensavalottajat));
  app.use(route.get('/ihmiset', ihmiset));
  app.use(route.get('/tutkimus', tutkimus));
  app.use(route.get('/blogi', blogi));
  app.use(route.get('/blogi/:path', blogiTeksti));
  app.use(route.get('/blogi/sivu/:number', blogiSivu));
  app.use(route.get('/blogi/lukutila/sivu/:number', blogiLukutila));
  app.use(route.get('/esikatselu/:ownerUUID/:itemUUID/:code', esikatselu));
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
  app.use(route.get('/ihmiset/sami', sami));
  app.use(route.get('/ihmiset/santeri', santeri));
  app.use(route.get('/ihmiset/selina', selina));
  app.use(route.get('/ihmiset/sonja', sonja));
  app.use(route.get('/ihmiset/tapani', tapani));
  app.use(route.get('/ihmiset/timo', timo));
  app.use(route.get('/ihmiset/villiam', villiam));
  app.use(route.get('/ihmiset/santeri/esittely', santeriEsittely));
  app.use(route.get('/ihmiset/santeri/sisainen-motivaatio', santeriSisainenMotivaatio));
  app.use(route.get('/robots.txt', robots));

  // Helper functions

  async function getUnrenderedBlogs(){
    let faPublicItems = await backendClient.getPublicItems('filosofian-akatemia');
    return filterBlogsFromPublicItems(faPublicItems);
  }

  function filterBlogsFromPublicItems(faPublicItems){
    var unrenderedBlogs = faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
    if (config.debug){
      var unrenderedDevelopmentBlogs = faPublicItems.getNotes([{type: "keyword", include: "devblogi"}]);
      return unrenderedDevelopmentBlogs.concat(unrenderedBlogs);
    }else{
      return unrenderedBlogs;
    }
  }

  function renderBlogPost(ctx, faPublicItems, blogPost) {
    let blog = generateBlogPost(blogPost);
    for (let i=0; i<blogPost.keywords.length; i++) {
      if (isAuthorTag(blogPost.keywords[i])) {
        // Get the introduction of the author.
        let personDescriptionPath = getAuthorDescriptionPath(blogPost.keywords[i].title);
        let personDescriptionNote = faPublicItems.getNote(personDescriptionPath);
        if (personDescriptionNote){
          if (!blog.author) {
            blog.author = {};
          }
          blog.author.description = markdownParser.render(personDescriptionNote.content);
          blog.author.pictureSource = getAuthorThumbnailPath(blogPost.keywords[i].title);
        }
        break;
      }
    }
    let context = {
      blog: blog
    };
    ctx.body = render('pages/blogiteksti', context);
  }

  function generateBlogs(unrenderedBlogs) {
    let blogs = [];
    for (let i=0; i<unrenderedBlogs.length; i++) {
      blogs.push(generateBlogPost(unrenderedBlogs[i]));
    }
    return blogs;
  }

  function generateBlogPost(publicNote) {
    let blog = {safeTitle: publicNote.title, title: publicNote.title.replace("&shy;", "")};
    let noteHtml = markdownParser.render(publicNote.content);
    let extractResult = extractLeadAndPictureAndContentFromHtml(noteHtml);
    blog.content = extractResult.content;
    if ((blog.content.match(/<p>/g) || []).length < 4){
      blog.lessThanFourParagraphs = true;
    }
    blog.lead = extractResult.lead;

    if (extractResult.pictureData) {
      blog.pictureData = extractResult.pictureData;
    }

    if (publicNote.keywords && publicNote.keywords.length) {
      for (let i=0; i<publicNote.keywords.length; i++) {
        if (isAuthorTag(publicNote.keywords[i])) {
          blog.author = {
            id: publicNote.keywords[i].title,
            name: getAuthorName(publicNote.keywords[i])
          };
          if (!blog.pictureData) {
            // Get the picture of the author, when the blog post has no picture set.
            blog.pictureData = {
              source: getAuthorPicturePath(publicNote.keywords[i])
            }
          }
          break;
        }
      }
    }
    blog.published = publicNote.visibility.published;
    blog.path = publicNote.visibility.path;
    return blog;
  }

  function extractLeadAndPictureAndContentFromHtml(htmlText) {
    let extractedHTML = {};
    // Create DOM from HTML string.
    let contentDocument = jsdom(htmlText);
    let bodyElement = contentDocument.getElementsByTagName('body')[0];
    let firstChildElement = bodyElement.firstElementChild;
    // Elements are wrapped into paragraphs (<p> tags), check the content of the first child node.
    let firstGrandChildElement = firstChildElement.firstElementChild;

    if (firstGrandChildElement && firstGrandChildElement.nodeName === 'IMG') {
      // First child node contains a picture.
      extractedHTML.pictureData = {
        picture: firstChildElement.innerHTML,
        source: firstGrandChildElement.src
      };
      if (firstGrandChildElement.title) {
        // Get the caption stored into the title attribute of the element.
        extractedHTML.pictureData.caption = firstGrandChildElement.title;
      }
      let secondChildElement = bodyElement.children[1];  // Get the second child element.
      extractedHTML.lead = secondChildElement.innerHTML;

      bodyElement.removeChild(firstChildElement);
      bodyElement.removeChild(secondChildElement);
    } else {
      bodyElement.removeChild(firstChildElement);
      extractedHTML.lead = firstChildElement.innerHTML;
    }
    extractedHTML.content = bodyElement.innerHTML

    return extractedHTML;
  }

  async function getPersonContext(personPath) {
    let faPublicItems = await backendClient.getPublicItems('filosofian-akatemia');
    let personNote = faPublicItems.getNote(personPath);
    if (personNote){
      return {
        personQuote: true,
        personDescription: markdownParser.render(personNote.content)
      };
    }
  }

  function isAuthorTag(tag) {
    if (getAuthorName(tag)){
      return true;
    }
  }

  function getAuthorName(tag) {
    switch (tag.title) {
      case 'emilia':
      return 'Emilia Lahti';
      case 'frank':
      return 'Frank Martela';
      case 'iida':
      return 'Iida Mäkikallio';
      case 'joonas':
      return 'Joonas Pesonen';
      case 'jp':
      return 'Jukka-Pekka Salo';
      case 'karoliina':
      return 'Karoliina Jarenko';
      case 'lauri':
      return 'Lauri Järvilehto';
      case 'maria':
      return 'Maria Ruotsalainen';
      case 'peter':
      return 'Peter Kenttä';
      case 'reima':
      return 'Reima Launonen';
      case 'sami':
      return 'Sami Paju';
      case 'santeri':
      return 'Santeri Lanér';
      case 'selina':
      return 'Selina Bakir';
      case 'sonja':
      return 'Sonja Strömsholm';
      case 'tapani':
      return 'Tapani Riekki';
      case 'timo':
      return 'Timo Tiuraniemi';
      case 'villiam':
      return 'Villiam Virkkunen';
      case 'fa':
      return 'Filosofian Akatemia';
    }
  }

  function getAuthorPicturePath(tag) {
    switch (tag.title) {
      case 'emilia':
      return 'https://filosofianakatemia.fi/static/img/emilia-large.jpg';
      case 'frank':
      return 'https://filosofianakatemia.fi/static/img/frank-large.jpg';
      case 'iida':
      return 'https://filosofianakatemia.fi/static/img/iida-large.jpg';
      case 'joonas':
      return 'https://filosofianakatemia.fi/static/img/joonas-large.jpg';
      case 'jp':
      return 'https://filosofianakatemia.fi/static/img/jp-large.jpg';
      case 'karoliina':
      return 'https://filosofianakatemia.fi/static/img/karoliina-large.jpg';
      case 'lauri':
      return 'https://filosofianakatemia.fi/static/img/lauri-large.jpg';
      case 'maria':
      return 'https://filosofianakatemia.fi/static/img/maria-large.jpg';
      case 'peter':
      return 'https://filosofianakatemia.fi/static/img/peter-large.jpg';
      case 'reima':
      return 'https://filosofianakatemia.fi/static/img/reima-large.jpg';
      case 'sami':
      return 'https://filosofianakatemia.fi/static/img/sami-large.jpg';
      case 'santeri':
      return 'https://filosofianakatemia.fi/static/img/santeri-large.jpg';
      case 'selina':
      return 'https://filosofianakatemia.fi/static/img/selina-large.jpg';
      case 'sonja':
      return 'https://filosofianakatemia.fi/static/img/sonja-large.jpg';
      case 'tapani':
      return 'https://filosofianakatemia.fi/static/img/tapani-large.jpg';
      case 'timo':
      return 'https://filosofianakatemia.fi/static/img/timo-large.jpg';
      case 'villiam':
      return 'https://filosofianakatemia.fi/static/img/villiam-large.jpg';
      case 'fa':
      return 'https://filosofianakatemia.fi/static/img/address-circle.png';
    }
  }

  function getAuthorDescriptionPath(authorId) {
    for (let i = 0; i < people.length; i++) {
      if (people[i].id === authorId) {
        return people[i].paths.description;
      }
    }
  }

  function getAuthorThumbnailPath(authorId) {
    for (let i = 0; i < people.length; i++) {
      if (people[i].id === authorId) {
        return people[i].pictures.thumbnail;
      }
    }
  }

  const people = [{
    id: 'emilia',
    pictures: {
      thumbnail: '/static/img/emilia-thumbnail.png'
    },
    paths: {
      description: 'emilia-lahti-kuvaus'
    }
  },
  {
    id: 'frank',
    pictures: {
      thumbnail: '/static/img/frank-thumbnail.png'
    },
    paths: {
      description: 'frank-martela-kuvaus'
    }
  },
  {
    id: 'iida',
    pictures: {
      thumbnail: '/static/img/iida-thumbnail.png'
    },
    paths: {
      description: 'iida-makikallio-kuvaus'
    }
  },
  {
    id: 'joonas',
    pictures: {
      thumbnail: '/static/img/joonas-thumbnail.png'
    },
    paths: {
      description: 'joonas-pesonen-kuvaus'
    }
  },
  {
    id: 'jp',
    pictures: {
      thumbnail: '/static/img/jp-thumbnail.png'
    },
    paths: {
      description: 'jp-salo-kuvaus'
    }
  },
  {
    id: 'karoliina',
    pictures: {
      thumbnail: '/static/img/karoliina-thumbnail.png'
    },
    paths: {
      description: 'karoliina-jarenko-kuvaus'
    }
  },
  {
    id: 'lauri',
    pictures: {
      thumbnail: '/static/img/lauri-thumbnail.png'
    },
    paths: {
      description: 'lauri-jarvilehto-kuvaus'
    }
  },
  {
    id: 'maria',
    pictures: {
      thumbnail: '/static/img/maria-thumbnail.png'
    },
    paths: {
      description: 'maria-ruotsalainen-kuvaus'
    }
  },
  {
    id: 'peter',
    pictures: {
      thumbnail: '/static/img/peter-thumbnail.png'
    },
    paths: {
      description: 'peter-kentta-kuvaus'
    }
  },
  {
    id: 'reima',
    pictures: {
      thumbnail: '/static/img/reima-thumbnail.png'
    },
    paths: {
      description: 'reima-launonen-kuvaus'
    }
  },
  {
    id: 'sami',
    pictures: {
      thumbnail: '/static/img/sami-thumbnail.png'
    },
    paths: {
      description: 'sami-paju-kuvaus'
    }
  },
  {
    id: 'santeri',
    pictures: {
      thumbnail: '/static/img/santeri-thumbnail.png'
    },
    paths: {
      description: 'santeri-laner-kuvaus'
    }
  },
  {
    id: 'selina',
    pictures: {
      thumbnail: '/static/img/selina-thumbnail.png'
    },
    paths: {
      description: 'selina-bakir-kuvaus'
    }
  },
  {
    id: 'sonja',
    pictures: {
      thumbnail: '/static/img/sonja-thumbnail.png'
    },
    paths: {
      description: 'sonja-stromsholm-kuvaus'
    }
  },
  {
    id: 'tapani',
    pictures: {
      thumbnail: '/static/img/tapani-thumbnail.png'
    },
    paths: {
      description: 'tapani-riekki-kuvaus'
    }
  },
  {
    id: 'timo',
    pictures: {
      thumbnail: '/static/img/timo-thumbnail.png'
    },
    paths: {
      description: 'timo-tiuraniemi-kuvaus'
    }
  },
  {
    id: 'villiam',
    pictures: {
      thumbnail: '/static/img/villiam-thumbnail.png'
    },
    paths: {
      description: 'villiam-virkkunen-kuvaus'
    }
  }];

}
