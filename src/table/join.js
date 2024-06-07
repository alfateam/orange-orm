var newJoinRelation = require('./newJoinRelation');
var newRelatedTable = require('./newRelatedTable');

function newJoin(parentTable, childTable) {
	var c = {};
	var columnNames = [];
	var relation;

	c.by = function() {
		for (var i = 0; i < arguments.length; i++) {
			columnNames.push(getColumnName(arguments[i]));
		}
		relation = newJoinRelation(parentTable, childTable, columnNames);
		relation.as = c.as;
		return relation;
	};

	function getColumnName(columnName) {
		var columns = parentTable._columns;
		for (var i = 0; i < columns.length; i++) {
			if (columns[i]._dbName === columnName || columns[i].alias === columnName)
				return columns[i]._dbName;
		}
		throw new Error('Unknown column: ' + columnName);
	}

	c.as = function(alias) {
		relation.leftAlias = alias;
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

module.exports = newJoin;
