/*jslint node: true */
'use strict';

var Data = function () {};

var request = require('superagent');
var thunkify = require('thunkify');
var get = thunkify(request.get);

var notes;

Data.prototype.getLatest = function *(info) {
  console.log('return latest');
  if (info && info.notes) {
    // Return the same JSON
    return info.notes;
  } else {
    if (!notes) {
      // No cached notes.
      var res = yield get(info);
      notes = res.body.notes;
      return notes;
    } else {
      // TODO: Get latest and merge with cached notes.
    }
  }
};

module.exports = Data;
