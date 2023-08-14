var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newWhereSql(relations,shallowFilter, depth) {
	let relation = relations[depth];
	var c = {};
	var sql;

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var alias = depth === 0 ? relation.parentTable._dbName : '_' + depth ;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		where(alias,leftColumns,rightColumns);
	};

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;
		var childTable = joinRelation.childTable;
		var leftColumns = childTable._primaryColumns;
		var alias = depth === 0 ? childTable._dbName : '_' + depth;
		where(alias,leftColumns,rightColumns);
	};

	c.visitMany = c.visitOne;

	function where(alias,leftColumns,rightColumns) {
		var table = relation.childTable;
		var joinCore = newShallowJoinSql(table,leftColumns,rightColumns,alias,'_' + (depth + 1));
		if (shallowFilter)
			sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
		else
			sql = ' WHERE ' + joinCore;
	}

	relation.accept(c);
	return sql;
}

module.exports = newWhereSql;
