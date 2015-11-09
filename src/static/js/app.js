/*
* http://addyosmani.com/blog/essential-js-namespacing/
*/
(function(app) {
  'use strict';
  /*global FB, Foundation*/

  app.menuActiveFeatureClicked = function() {
    if (typeof Foundation !== undefined) Foundation.libs.topbar.toggle();
  };

  app.facebookShareBlog = function(path, title, picture) {
    FB.ui(
    {
      method: 'share',
      href: 'https://filosofianakatemia.fi/blogi' + path,
      picture: picture,
      title: title,
      description: 'TODO: ingress'
    },
    function(/*response*/) {
      return null;
    });
  };

  app.twitterShareBlog = function(path, title) {
    // http://gpiot.com/blog/elegant-twitter-share-button-and-dialog-with-jquery/
    var sharelUrl = 'https://filosofianakatemia.fi/blogi' + path;
    var shareVia = 'filosofianakate';
    var url = 'http://twitter.com/share?via=' + shareVia + '&amp;url=' + sharelUrl + '&amp;text=' + title;
    window.open(url, '_blank', 'height=420, width=550');
  };

})(window.app = window.app || {});
