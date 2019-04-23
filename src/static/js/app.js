/*
* http://addyosmani.com/blog/essential-js-namespacing/
*/
(function(app) {
  'use strict';
  /*global FB, Foundation*/

  app.menuActiveFeatureClicked = function(activeFeature) {
    /*
    http://stackoverflow.com/a/6944834
    https://css-tricks.com/snippets/javascript/get-url-and-url-parts-in-javascript/
    */
    var pathArray = window.location.pathname.split('/');
    var lastLevelLocation = pathArray[pathArray.length - 1];
    if (lastLevelLocation !== activeFeature && lastLevelLocation !== '') {
      // We are in a subpage, redirect to main page of the active feature.
      window.location.href = '/' + activeFeature;
    }
    if (typeof Foundation !== undefined) {
      Foundation.libs.topbar.toggle();
    }
  };

  app.facebookShareBlog = function(event, lead, path, title, pictureUrl) {
    event.preventDefault();
    FB.ui(
    {
      method: 'share',
      href: 'https://filosofianakatemia.fi/blogi/' + path,
      picture: pictureUrl,
      title: title,
      description: lead
    },
    function(/*response*/) {
      return null;
    });
  };

  app.twitterShareBlog = function(event, path, title) {
    event.preventDefault();
    // http://gpiot.com/blog/elegant-twitter-share-button-and-dialog-with-jquery/
    var sharelUrl = 'https://filosofianakatemia.fi/blogi/' + path;
    var shareVia = 'filosofianakate';
    var url = 'https://twitter.com/intent/tweet?via=' + shareVia + '&url=' + encodeURIComponent(sharelUrl) + '&text=' + encodeURIComponent(title);
    window.open(url, '_blank', 'height=420, width=550');
  };

  app.linkedInShareBlog = function(event, lead, path, title) {
    event.preventDefault();
    var sharelUrl = 'https://filosofianakatemia.fi/blogi/' + path;
    var url = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(sharelUrl) + '&title=' + encodeURIComponent(title) +
    '&summary=' + encodeURIComponent(lead) + '&source=Filosofian%20Akatemia';
    window.open(url, '_blank', 'height=420, width=550');
  };

})(window.app = window.app || {});
