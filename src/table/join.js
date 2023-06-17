var newJoinRelation = require('./newJoinRelation');
var newRelatedTable = require('./newRelatedTable');
const isMany = false;

function newJoin(parentTable, childTable) {
	var c = {};
	var columnNames = [];

	c.by = function() {
		for (var i = 0; i < arguments.length; i++) {
			columnNames.push(getColumnName(arguments[i]));
		}
		return c;
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
		var relation = newJoinRelation(parentTable, childTable, columnNames);
		relation.leftAlias = alias;
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

module.exports = newJoin;
