var newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newWhereSql(relations, shallowFilter, rightAlias) {
	var sql;
	var relationCount = relations.length;
	var relation = relations[0];
	var leftAlias = 'x' + relationCount;
	var table = relation.childTable;
	var leftColumns = relation.columns;
	var rightColumns = table._primaryColumns;
	where();

	function where() {
		var table = relation.childTable;
		var joinCore = newShallowJoinSql(table, leftColumns, rightColumns, leftAlias, rightAlias);
		if (shallowFilter.sql())
			sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
		else
			sql = ' WHERE ' + joinCore;
	}
	return sql;
}

module.exports = newWhereSql;
