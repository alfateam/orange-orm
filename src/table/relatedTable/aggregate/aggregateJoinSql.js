var newShallowJoinSql = require('../../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newAggregateJoinSql(relations, prefix) {
	let relation = relations[0];
	var c = {};
	var sql;

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var alias = relation.parentTable._rootAlias || relation.parentTable._dbName;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		joinSql(alias, leftColumns, rightColumns);
	};

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;
		var childTable = joinRelation.childTable;
		var leftColumns = childTable._primaryColumns;
		var alias = childTable._rootAlias || childTable._dbName;
		joinSql(alias, leftColumns, rightColumns);
	};

	c.visitMany = c.visitOne;

	function joinSql(alias, leftColumns, rightColumns) {
		var table = relation.childTable;
		var joinCore = newShallowJoinSql(table, leftColumns, rightColumns, alias, prefix + 1);
		sql = joinCore;
	}

	relation.accept(c);
	return sql;
}

module.exports = newAggregateJoinSql;
