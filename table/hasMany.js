var newManyRelation = require('./newManyRelation');
var newGetRelatedTable = require('./newGetRelatedTable');

function newJoin(joinRelation) {
	var c = {};
	var relation = newManyRelation(joinRelation);

	c.as = function(alias) {
		var table = joinRelation.childTable;
		table[alias] = newGetRelatedTable(relation);
	}

	return c;
}

module.exports = newJoin;