var newManyRelation = require('./newManyRelation');
var newGetRelatedTable = require('./newGetRelatedTable');

function newOne(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function (alias) {	
		var relation = newManyRelation(joinRelation);
		parentTable._relations[alias] = relation;
		parentTable[alias] = newGetRelatedTable(relation);
		return relation;
	};

	return c;
}

module.exports = newOne;