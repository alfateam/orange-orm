var synchronizeChanged = require('./manyCache/synchronizeChanged');
var synchronizeAdded = require('./manyCache/synchronizeAdded');
var synchronizeRemoved = require('./manyCache/synchronizeRemoved');
var extractParentKey = require('./manyCache/extractParentKey');
var newCacheCore = require('./newManyCacheCore');
var newId = require('../../newId');
var getSessionCache = require('../getSessionCache');
var setSessionCache = require('../setSessionCache');

function newManyCache(joinRelation) {
	var c = {};
	var key = newId();

	c.tryAdd = function(parent, child) {
		c.getInnerCache().tryAdd(parent, child);
		synchronizeChanged(c, joinRelation, parent, child);
	};

	c.tryRemove = function(parent, child) {
		c.getInnerCache().tryRemove(parent, child);
	};

	c.tryGet = function(parentRow) {
		return c.getInnerCache().tryGet(parentRow);
	};

	c.getInnerCache = function() {
		var cache = getSessionCache(key);
		if (!cache) {
			cache = newCacheCore(joinRelation);
			setSessionCache(key, cache);
			fillCache();
			synchronizeAdded(c.tryAdd, joinRelation);
			synchronizeRemoved(c.tryRemove, joinRelation);
		}
		return cache;
	};


	function fillCache() {
		var childTable = joinRelation.parentTable;
		var childCache = childTable._cache;
		var children = childCache.getAll();
		children.forEach(addToCache);

		function addToCache(child) {
			var parent = extractParentKey(joinRelation, child);
			c.tryAdd(parent, child);
		}
	}



	return c;
}

module.exports = newManyCache;