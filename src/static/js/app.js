/*
* http://addyosmani.com/blog/essential-js-namespacing/
*/
(function(app) {
  'use strict';
  /*global Foundation*/

  app.menuActiveFeatureClicked = function() {
    if (typeof Foundation !== undefined) Foundation.libs.topbar.toggle();
  };
})(window.app = window.app || {});
