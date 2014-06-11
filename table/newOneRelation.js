var newLeg = require('./relation/newOneLeg');
var newOneCache = require('./relation/newOneCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var newExpanderCache = require('./relation/newExpanderCache');
var getFarRelatives = require('./oneRelation/getFarRelatives');
var resultToPromise = require('./resultToPromise');

function newOneRelation(joinRelation) {
    var c = {};
    var oneCache = newOneCache(joinRelation);
    var expanderCache = newExpanderCache(joinRelation);

    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;

    c.accept = function(visitor) {
        visitor.visitOne(c);
    };

    c.getRows = function(parentRow) {
        if (expanderCache.tryGet(parentRow)) {
            var row = oneCache.tryGet(parentRow);
            return resultToPromise(row);
        }
        return getFarRelatives(parentRow, c)
            .then(tryGetFirst)
            .then(expand);

        function tryGetFirst() {
            var filter = newForeignKeyFilter(joinRelation, parentRow);
            return c.childTable.tryGetFirst(filter);
        }

        function expand(result) {
            expanderCache.tryAdd(parentRow);    
            return result;
        };        
    };

    c.expand = expanderCache.tryAdd;

    c.toLeg = function() {
        return newLeg(c);
    };

    return c;
}

module.exports = newOneRelation;