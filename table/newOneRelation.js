var newLeg = require('./relation/newOneLeg');
var newOneCache = require('./relation/newOneCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var getRelatives = require('./oneRelation/getRelatives');
var resultToPromise = require('./resultToPromise');
var newGetRelated = require('./newGetRelated');

function newOneRelation(joinRelation) {
    var c = {};
    var oneCache = newOneCache(joinRelation);

    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;

    c.accept = function(visitor) {
        visitor.visitOne(c);
    };

    c.getFromCache = function(parent) {
        var row = oneCache.tryGet(parent);
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

    c.getRowsSync = oneCache.tryGet;

    c.toLeg = function() {
        return newLeg(c);
    };

    return c;
}

module.exports = newOneRelation;