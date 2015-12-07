/*jslint node: true */
'use strict';

const siteutils = require('../node_modules/extendedmind-siteutils/transpile/index.js');
const route = siteutils.koaRoute;
const path = require('path');
const request = require('superagent-promise')(require('superagent'), Promise);
const markdownParser = require('markdown-it')({breaks: true, linkify: true});
const jsdom = require('jsdom').jsdom;

module.exports = (config, app, backendApi) => {

  var settings = config.debug ? {syncTimeTreshold: 0} : undefined;
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


  // ROUTE MIDDLEWARE

  function index(ctx) {
    console.log('GET /');
    ctx.body = render('pages/etusivu');
  }
  function palvelut(ctx) {
    console.log('GET /palvelut');
    ctx.body = render('pages/palvelut');
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
    let renderedBlogs = renderBlogs(unrenderedBlogs.slice(0, 5));
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
      let renderedBlogs = renderBlogs(unrenderedBlogs.slice(sliceStartIndex, sliceStartIndex+5));
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
    let publicNote = faPublicItems.getNote(path);

    if (publicNote && publicNote.keywords && publicNote.keywords.length) {
      let keywordFound = false;
      for (let i = 0; i < publicNote.keywords.length; i++) {
        if (publicNote.keywords[i].title === 'blogi') {
          keywordFound = true;
          break;
        } else if (publicNote.keywords[i].parent) {
          let parentTag = faPublicItems._getTagByUUID(publicNote.keywords[i].parent);
          if (parentTag && parentTag.title === 'blogi') {
            keywordFound = true;
            break;
          }
        }
      }
      if (keywordFound) {
        let context = {
          blog: renderBlogPost(publicNote)
        };
        ctx.body = render('pages/blogiteksti', context);
      }
    }
  }

  async function aleksej(ctx) {
    console.log('GET /ihmiset/aleksej');
    const personContext = await getPersonContext('aleksej-fedotov');
    ctx.body = render('pages/aleksej', personContext);
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

  app.use(route.get('/', index));
  app.use(route.get('/palvelut', palvelut));
  app.use(route.get('/ihmiset', ihmiset));
  app.use(route.get('/tutkimus', tutkimus));
  app.use(route.get('/blogi', blogi));
  app.use(route.get('/blogi/:path', blogiTeksti));
  app.use(route.get('/blogi/sivu/:number', blogiSivu));
  app.use(route.get('/blogi/lukutila/sivu/:number', blogiLukutila));
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
  app.use(route.get('/ihmiset/santeri/esittely', santeriEsittely));

  // Helper functions

  async function getUnrenderedBlogs(){
    let faPublicItems = await backendClient.getPublicItems('filosofian-akatemia');
    return faPublicItems.getNotes([{type: "keyword", include: "blogi"}]);
  }

  function renderBlogs(unrenderedBlogs) {
    let blogs = [];
    for (let i=0; i<unrenderedBlogs.length; i++) {
      blogs.push(renderBlogPost(unrenderedBlogs[i]));
    }
    return blogs;
  }

  function renderBlogPost(publicNote) {
    let blog = {title: publicNote.title};
    let noteHtml = markdownParser.render(publicNote.content);
    let extractResult = extractLeadAndPictureAndContentFromHtml(noteHtml);
    blog.content = extractResult.content;
    blog.lead = extractResult.lead;

    if (extractResult.pictureData) {
      blog.pictureData = extractResult.pictureData;
    }

    if (publicNote.keywords && publicNote.keywords.length) {
      for (let i=0; i<publicNote.keywords.length; i++) {
        if (isAuthorTag(publicNote.keywords[i])) {
          blog.author = getAuthorName(publicNote.keywords[i]);
          if (!blog.pictureData) {
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
    if (tag.title === 'aleksej' || tag.title === 'frank' || tag.title === 'iida' || tag.title === 'joonas' ||
        tag.title === 'karoliina' || tag.title === 'lauri' || tag.title === 'maria' ||
        tag.title === 'santeri' || tag.title === 'selina' || tag.title === 'sonja' || tag.title === 'tapani')
    {
      return true;
    }
  }

  function getAuthorName(tag) {
    switch (tag.title) {
      case 'aleksej':
      return 'Aleksej Fedotov';
      case 'frank':
      return 'Frank Martela';
      case 'iida':
      return 'Iida Mäkikallio';
      case 'joonas':
      return 'Joonas Pesonen';
      case 'karoliina':
      return 'Karoliina Jarenko';
      case 'lauri':
      return 'Lauri Järvilehto';
      case 'maria':
      return 'Maria Ruotsalainen';
      case 'santeri':
      return 'Santeri Lanér';
      case 'selina':
      return 'Selina Bakir';
      case 'sonja':
      return 'Sonja Strömsholm';
      case 'tapani':
      return 'Tapani Riekki';
    }
  }

  function getAuthorPicturePath(tag) {
    switch (tag.title) {
      case 'aleksej':
      return 'https://filosofianakatemia.fi/static/img/aleksej-large.jpg';
      case 'frank':
      return 'https://filosofianakatemia.fi/static/img/frank-large.jpg';
      case 'iida':
      return 'https://filosofianakatemia.fi/static/img/iida-large.jpg';
      case 'joonas':
      return 'https://filosofianakatemia.fi/static/img/joonas-large.jpg';
      case 'karoliina':
      return 'https://filosofianakatemia.fi/static/img/karoliina-large.jpg';
      case 'lauri':
      return 'https://filosofianakatemia.fi/static/img/lauri-large.jpg';
      case 'maria':
      return 'https://filosofianakatemia.fi/static/img/maria-large.jpg';
      case 'santeri':
      return 'https://filosofianakatemia.fi/static/img/santeri-large.jpg';
      case 'selina':
      return 'https://filosofianakatemia.fi/static/img/selina-large.jpg';
      case 'sonja':
      return 'https://filosofianakatemia.fi/static/img/sonja-large.jpg';
      case 'tapani':
      return 'https://filosofianakatemia.fi/static/img/tapani-large.jpg';
    }
  }

}
