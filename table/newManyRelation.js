var newManyLeg = require('./relation/newManyLeg');
var newManyCache = require('./relation/newManyCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var newExpanderCache = require('./relation/newExpanderCache');
var resultToPromise = require('./resultToPromise');
var newGetRelated = require('../joinRelation/newGetRelated');

function newManyRelation(joinRelation) {
    var c = {};

    var manyCache = newManyCache(joinRelation);
    var expanderCache = newExpanderCache(joinRelation);

    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;
    var parentTable = joinRelation.childTable;

    c.accept = function(visitor) {
        visitor.visitMany(c);
    };

    c.getFromCache = function(parent) {
        return resultToPromise(manyCache.tryGet(parent));
    };

    c.getFromDb = function(parent) {
        var filter = newForeignKeyFilter(joinRelation, parent);
        return c.childTable.getMany(filter);
    };

    c.toGetRelated = function(parent) {
    //todo temporary
        return newGetRelated(parent, c);
    };


    c.expand = expanderCache.tryAdd;

    c.toLeg = function() {
        return newManyLeg(c);
    };

    return c;
};

module.exports = newManyRelation;
