var newManyLeg = require('./relation/newManyLeg');
var newManyCache = require('./relation/newManyCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var newExpanderCache = require('./relation/newExpanderCache');
var resultToPromise = require('./resultToPromise');

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

    c.getRows = function(parentRow) {
        if (expanderCache.tryGet(parentRow))
            return resultToPromise(manyCache.tryGet(parentRow));
        var filter = newForeignKeyFilter(joinRelation, parentRow);
        return c.childTable.getMany(filter).then(expand);

        function expand(result) {
            expanderCache.tryAdd(parentRow);
            return result;
        }
    };

    c.expand = expanderCache.tryAdd;

    c.isExpanded  = function() {
        //todo
    };

    c.toLeg = function() {
        return newManyLeg(c);
    };

    return c;
};

module.exports = newManyRelation;