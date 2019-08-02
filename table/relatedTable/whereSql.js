var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newWhereSql(relation,shallowFilter) {
	var c = {};
	var sql;

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var alias = relation.parentTable._dbName;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		where(alias,leftColumns,rightColumns);
	};

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;
		var childTable = joinRelation.childTable;
		var leftColumns = childTable._primaryColumns;
		var alias = childTable._dbName;
		where(alias,leftColumns,rightColumns);
	};

	c.visitMany = c.visitOne;

	function where(alias,leftColumns,rightColumns) {
		var table = relation.childTable;
		var joinCore = newShallowJoinSql(table,leftColumns,rightColumns,alias,'_1');
		if (shallowFilter)
			sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
		else
			sql = ' WHERE ' + joinCore;
	}

	relation.accept(c);
	return sql;
}

module.exports = newWhereSql;
