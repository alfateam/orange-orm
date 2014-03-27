var newLeg = require('./relation/newOneLeg');
var newOneCache = require('./relation/newOneCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');

function newOneRelation(joinRelation) {
    var c = {};
    var oneCache = newOneCache(joinRelation);


    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;

    c.accept = function(visitor) {
        visitor.visitOne(c);
    };

    c.getRows = function(parentRow) {
        var result = oneCache.tryGet(parentRow);
        if (result)
            return result;
        var filter = newForeignKeyFilter(joinRelation, parentRow);
        var result = c.childTable.tryGetFirstSync(filter);
        oneCache.add(parentRow, result);
        return result;
    };

    c.expand = function(parentRow) {
        //todo
    }


    c.toLeg = function() {
        return newLeg(c);
    };

    return c;
}

module.exports = newOneRelation;