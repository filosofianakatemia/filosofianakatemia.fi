/*jslint node: true */
'use strict';

var Data = function () {};

var request = require('superagent');
var thunkify = require('thunkify');
var get = thunkify(request.get);

var items, latestModified;

function findLatestModifiedTimeStamp(items) {
  var modified = items.modified;

  function findAndReturnLatestModifiedFromArray(modified, itemLikeArray) {
    for (var i = 0; i < itemLikeArray.length; i++) {
      if (modified < itemLikeArray[i].modified) {
        modified = itemLikeArray[i].modified;
      }
    }
    return modified;
  }

  if (items.notes) {
    modified = findAndReturnLatestModifiedFromArray(modified, items.notes);
  }
  if (items.tags) {
    modified = findAndReturnLatestModifiedFromArray(modified, items.tags);
  }
  return modified;
}

function mergeCachedItemsWithModifiedItems(items, modifiedItems) {

  function mergeItemLikeArray(cachedItemLikeArray, modifiedItemLikeArray) {
    if (!cachedItemLikeArray) {
      // No existing items, get the whole modified item array.
      cachedItemLikeArray = modifiedItemLikeArray;
    } else {
      for (var i = 0; i < modifiedItemLikeArray; i++) {
        var itemLikeIndex = findIndexByUuid(modifiedItemLikeArray[i].uuid, cachedItemLikeArray);
        if (itemLikeIndex === undefined) {
          // Item is new.
          cachedItemLikeArray.push(modifiedItemLikeArray[i]);
        } else {
          // Existing item.
          cachedItemLikeArray[itemLikeIndex] = modifiedItemLikeArray[i];
        }
      }
    }
    return cachedItemLikeArray;
  }

  function findIndexByUuid(uuid, itemLikeArray) {
    for (var i = 0; i < itemLikeArray; i++) {
      if (itemLikeArray[i].uuid === uuid) {
        return i;
      }
    }
  }

  if (modifiedItems.modified) {
    items.modified = modifiedItems.modified;
  }
  if (modifiedItems.notes) {
    console.log('merge notes');
    items.notes = mergeItemLikeArray(items.notes, modifiedItems.notes);
  }
  if (modifiedItems.tags) {
    items.tags = mergeItemLikeArray(items.tags, modifiedItems.tags);
  }

  return items;
}

Data.prototype.getLatest = function *(info) {
  console.log('return latest');
  if (info && info.notes) {
    // Return the same JSON
    return info.notes;
  } else {
    if (!items) {
      // No cached notes.
      console.log('no cached notes, get all public items');
      let res = yield get(info);
      items = res.body;
    } else {
      latestModified = findLatestModifiedTimeStamp(items);
      console.log('get modified items, merge cached items with modified items ' + latestModified);
      console.log(info + '?modified=' + latestModified);
      let res = yield get(info + '?modified=' + latestModified);
      items = mergeCachedItemsWithModifiedItems(items, res.body);
    }
    return items.notes;
  }
};

module.exports = Data;
