/*jslint node: true */
'use strict';

var Data = function () {};

var request = require('superagent');
var thunkify = require('thunkify');
var get = thunkify(request.get);

var items, latestModified, sinceLastItemsSynchronized;
var SYNC_TIME_THRESHOLD = 60000; // sync user if there has been a minute of non-syncing

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
      for (var i = 0; i < modifiedItemLikeArray.length; i++) {
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
    for (var i = 0; i < itemLikeArray.length; i++) {
      if (itemLikeArray[i].uuid === uuid) {
        return i;
      }
    }
  }

  if (modifiedItems.modified) {
    items.modified = modifiedItems.modified;
  }
  if (modifiedItems.notes) {
    items.notes = mergeItemLikeArray(items.notes, modifiedItems.notes);
  }
  if (modifiedItems.tags) {
    items.tags = mergeItemLikeArray(items.tags, modifiedItems.tags);
  }

  return items;
}

Data.prototype.getLatest = function *(info) {
  console.log('returning latest');
  if (typeof info === 'string') {
    if (!items) {
      // No cached items.
      console.log('no cached items, get all public items');
      let res = yield get(info);
      items = res.body;
      sinceLastItemsSynchronized = Date.now();
    } else if (Date.now() - sinceLastItemsSynchronized > SYNC_TIME_THRESHOLD) {
      latestModified = findLatestModifiedTimeStamp(items);
      console.log('get modified items, merge cached items with modified items ' + latestModified);
      let res = yield get(info + '?modified=' + latestModified);
      items = mergeCachedItemsWithModifiedItems(items, res.body);
      sinceLastItemsSynchronized = Date.now();
    }
    return items;
  } else if (info) {
    // Return the same JSON
    return info;
  }
};

Data.prototype.getItemByTitle = function(items, title) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].title === title) {
      return items[i];
    }
  }
};

Data.prototype.getItemsByTagUUID = function(items, tagUUID) {
  var itemsWithTag = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].relationships && items[i].relationships.tags &&
        items[i].relationships.tags.indexOf(tagUUID) !== -1)
    {
      itemsWithTag.push(items[i]);
    }
  }
  return itemsWithTag;
};

Data.prototype.orderItemsByObjectProperty = function(items, objectName, propertyName) {
  var orderedItems = [];
  function insertToOrdered(item) {
    var insertToIndex;
    for (var i = 0; i < orderedItems.length; i++) {
      if (orderedItems[i][objectName][propertyName] > item[objectName][propertyName]) {
        insertToIndex = i;
        break;
      } else if (orderedItems[i][objectName][propertyName] < item[objectName][propertyName]) {
        insertToIndex = i + 1;
        break;
      }
    }
    if (insertToIndex === undefined) {
      orderedItems.unshift(item);
    } else if (insertToIndex > orderedItems.length) {
      orderedItems.push(item);
    } else {
      orderedItems.splice(insertToIndex, item, 0);
    }
  }
  for (var i = 0; i < items.length; i++) {
    if (items[i][objectName] && items[i][objectName][propertyName]) {
      insertToOrdered(items[i]);
    }
  }
};

module.exports = Data;
