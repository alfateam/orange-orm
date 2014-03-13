var newOneRelation = require('./newOneRelation');
var newGetRelatedTable = require('./newGetRelatedTable');

function newOne(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function (alias) {	
		var relation = newOneRelation(joinRelation);
		parentTable._relations[alias] = relation;
		parentTable[alias] = newGetRelatedTable(relation);
		//todo relatedTable
		return relation;
	};

	return c;
}

module.exports = newOne;