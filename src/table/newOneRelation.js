var newLeg = require('./relation/newOneLeg');
var newOneCache = require('./relation/newOneCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var getRelatives = require('./oneRelation/getRelatives');
var fuzzyPromise = require('./fuzzyPromise');
var newGetRelated = require('./newGetRelated');

function newOneRelation(joinRelation) {
	var c = {};
	var oneCache = newOneCache(joinRelation);

	c.joinRelation = joinRelation;
	c.childTable = joinRelation.parentTable;
	c.parentTable = joinRelation.childTable;
	c.isOne = true;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	c.getFromCache = function(parent) {
		let row = c.getRowsSync(parent);
		return fuzzyPromise(row);
	};

	c.getFromDb = function(parent) {
		var filter = newForeignKeyFilter(joinRelation, parent);
		return c.childTable.tryGetFirst(filter, null);
	};

	c.getRelatives = function(parent) {
		return getRelatives(parent, c);
	};

	c.toGetRelated = function(parent) {
		return newGetRelated(parent, c);
	};

	c.expand = function(parent) {
		return parent.expand(joinRelation.rightAlias);
	};

	c.getRowsSync = function(parent) {
		let cache = parent._relationCacheMap.get(c);
		if (!cache)
			return null;
		return cache.tryGet(parent);
	};

	c.toLeg = function() {
		return newLeg(c);
	};

	c.getInnerCache = function() {
		return oneCache.getInnerCache();
	};

	return c;
}

module.exports = newOneRelation;