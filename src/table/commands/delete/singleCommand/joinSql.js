var newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSql');
var createAlias = require('../createAlias');

function newJoinSql(relations) {
	var length = relations.length;
	var leftAlias,
		rightAlias;
	var sql = '';

	function addSql(relation) {
		var rightColumns = relation.childTable._primaryColumns;
		var leftColumns = relation.columns;
		sql += ' INNER' + newShallowJoinSql(relation.childTable,leftColumns,rightColumns,leftAlias,rightAlias);
	}

	relations.forEach(function(relation, i){
		leftAlias = 'x' + (length-i);
		rightAlias = createAlias(relation.childTable, length-i-1);
		addSql(relation);

	});

	return sql;
}

module.exports = newJoinSql;
