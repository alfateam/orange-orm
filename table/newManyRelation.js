var newLeg = require('./relation/newManyLeg');
var newManyCache = require('./relation/newManyCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var getRelatives = require('./oneRelation/getRelatives');
var fuzzyPromise = require('./fuzzyPromise');
var newGetRelated = require('./newGetRelated');

function newManyRelation(joinRelation) {
	var c = {};
	var manyCache = newManyCache(joinRelation);

	c.joinRelation = joinRelation;
	c.childTable = joinRelation.parentTable;
	c.isMany = true;

	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.getFromCache = function(parent) {
		var result = c.getRowsSync(parent);
		return fuzzyPromise(result);
	};

	c.getFromDb = function(parent) {
		var filter = newForeignKeyFilter(joinRelation, parent);
		return c.childTable.getMany(filter, null);
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
		return cache.tryGet(parent);
	};

	c.toLeg = function() {
		return newLeg(c);
	};

	c.getInnerCache = function() {
		return manyCache.getInnerCache();
	};

	return c;
}

module.exports = newManyRelation;
