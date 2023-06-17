var newOneRelation = require('./newOneRelation');
var newRelatedTable = require('./newRelatedTable');
const isMany = false;

function newOne(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function(alias) {
		joinRelation.rightAlias = alias;
		var relation = newOneRelation(joinRelation);
		parentTable._relations[alias] = relation;

		Object.defineProperty(parentTable, alias, {
			get: function() {
				return newRelatedTable([relation], undefined, isMany);
			}
		});
		return relation;
	};

	return c;
}

module.exports = newOne;