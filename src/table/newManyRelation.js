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
	c.parentTable = joinRelation.childTable;
	c.isMany = true;

	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.getFromCache = function(parent) {
		var result = c.getRowsSync(parent);
		return fuzzyPromise(result);
	};

	c.getFromDb = function(context, parent) {
		var filter = newForeignKeyFilter(context, joinRelation, parent);
		return c.childTable.getMany(context, filter, null);
	};

	c.getRelatives = function(context, parent) {
		return getRelatives(context, parent, c);
	};

	c.toGetRelated = function(context, parent) {
		return newGetRelated(context, parent, c);
	};

	c.expand = function(parent) {
		return parent.expand(joinRelation.rightAlias);
	};

	c.getRowsSync = function(parent) {
		let cache = parent._relationCacheMap.get(c);
		if (!cache)
			return [];
		return cache.tryGet(parent);
	};

	c.toLeg = function() {
		return newLeg(c);
	};

	c.getInnerCache = function(context) {
		return manyCache.getInnerCache(context);
	};

	return c;
}

module.exports = newManyRelation;
