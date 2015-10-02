/*jslint node: true */
'use strict';

var Data = function () {};

var request = require('superagent');
var thunkify = require('thunkify');
var get = thunkify(request.get);

Data.prototype.getLatest = function *(info) {
  console.log('return latest');
  if (info && info.notes) {
    // Return the same JSON
    return info.notes;
  } else {
    var res = yield get(info);
    return res.body.notes;
  }
};

module.exports = Data;
