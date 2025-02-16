var synchronizeChanged = require('./manyCache/synchronizeChanged');
var synchronizeAdded = require('./manyCache/synchronizeAdded');
var synchronizeRemoved = require('./manyCache/synchronizeRemoved');
var extractParentKey = require('./manyCache/extractParentKey');
var newCacheCore = require('./newManyCacheCore');
var newId = require('../../newId');
var getSessionSingleton = require('../getSessionSingleton');
var setSessionSingleton = require('../setSessionSingleton');

function newManyCache(joinRelation) {
	var c = {};
	var key;

	c.tryAdd = function(context, parent, child) {
		c.getInnerCache(context).tryAdd(parent, child);
		synchronizeChanged(context, c, joinRelation, parent, child);
	};

	c.tryRemove = function(context, parent, child) {
		c.getInnerCache(context).tryRemove(parent, child);
	};

	c.tryGet = function(context, parentRow) {
		return c.getInnerCache(context).tryGet(parentRow);
	};

	c.getInnerCache = function(context) {
		const theKey = negotiateKey();
		var cache = getSessionSingleton(context, theKey);
		if (!cache) {
			cache = newCacheCore(joinRelation);
			setSessionSingleton(context, theKey, cache);
			fillCache(context);
			synchronizeAdded(context, c.tryAdd.bind(null, context), joinRelation);
			synchronizeRemoved(context, c.tryRemove.bind(null, context), joinRelation);
		}
		return cache;
	};


	function fillCache(context) {
		var childTable = joinRelation.parentTable;
		var childCache = childTable._cache;
		var children = childCache.getAll(context);
		children.forEach(addToCache);

		function addToCache(child) {
			var parent = extractParentKey(joinRelation, child);
			c.tryAdd(context, parent, child);
		}
	}

	function negotiateKey() {
		if (key)
			return key;
		key = newId();
		return key;

	}


	return c;
}

module.exports = newManyCache;