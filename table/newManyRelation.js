var newManyLeg = require('./relation/newManyLeg');
var newManyCache = require('./relation/newManyCache');
var newForeignKeyFilter = require('./relation/newForeignKeyFilter');

function newManyRelation(joinRelation) {
    var c = {};

	var manyCache = newManyCache(joinRelation);

    c.joinRelation = joinRelation;
    c.childTable = joinRelation.parentTable;
    var parentTable = joinRelation.childTable;

    c.accept = function(visitor) {
        visitor.visitMany(c);
    };

    c.getRows = function(parentRow) {
    	var result = manyCache.tryGet(parentRow);
    	 if(result !== null)
    		return result;
    	var filter = newForeignKeyFilter(joinRelation, parentRow);
    	var result = c.childTable.getManySync(filter);
    	manyCache.add(parentRow, result);
    	return result;
    };

    c.toLeg = function() {
        return newManyLeg(c);
    };

    return c;
};

module.exports = newManyRelation;