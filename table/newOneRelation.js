var newLeg = require('./relation/newOneLeg');
var newOneCache = require('./relation/newOneCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');
var newExpanderCache = require('./relation/newExpanderCache');

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
        if (expanderCache.tryGet(parentRow))
            return oneCache.tryGet(parentRow);
        var filter = newForeignKeyFilter(joinRelation, parentRow);
        return c.childTable.tryGetFirst(filter).then(expand);

        function expand(result) {
            expanderCache.add(parentRow);    
            return result;
        };        
    };

    c.expand = expanderCache.add;

    c.toLeg = function() {
        return newLeg(c);
    };

    return c;
}

module.exports = newOneRelation;