var newManyRelation = require('./newManyRelation');
var newRelatedTable = require('./newRelatedTable');

function newOne(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function(alias) {
		joinRelation.rightAlias = alias;
		var relation = newManyRelation(joinRelation);
		parentTable._relations[alias] = relation;

		Object.defineProperty(parentTable, alias, {
			get: function() {
				return newRelatedTable([relation]);
			}
		});

		return relation;
	};

	c.notNullExceptInsert = function() {
		return c;
	};

	c.notNull = function() {
		return c;
	};

	return c;
}

module.exports = newOne;