var newLeg = require('./relation/newManyLeg');
var newManyCache = require('./relation/newManyCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var getRelatives = require('./oneRelation/getRelatives');
var resultToPromise = require('./resultToPromise');
var newGetRelated = require('./newGetRelated');

function newManyRelation(joinRelation) {
    var c = {};
    var manyCache = newManyCache(joinRelation);

    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;

    c.accept = function(visitor) {
        visitor.visitMany(c);
    };

    c.getFromCache = function(parent) {
        var row = manyCache.tryGet(parent);
        return resultToPromise(row);
    };

    c.getFromDb = function(parent) {
        var filter = newForeignKeyFilter(joinRelation, parent);
        return c.childTable.tryGetFirst(filter);
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

    c.getRowsSync = manyCache.tryGet;
    
    c.isExpanded  = function(parent) {
        return parent.isExpanded(joinRelation.rightAlias);
    };

    c.toLeg = function() {
        return newLeg(c);
    };

    return c;
}

module.exports = newManyRelation;
