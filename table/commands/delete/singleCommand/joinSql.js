var newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSql');

function newJoinSql(relations) {
	var length = relations.length;
	var leftAlias,
		rightAlias;
	var c = {};
	var i;
	var sql = '';

	function addSql(relation) {
		var rightColumns = relation.childTable._primaryColumns;
		var leftColumns = relation.columns;
		sql += ' INNER' + newShallowJoinSql(relation.childTable,leftColumns,rightColumns,leftAlias,rightAlias);	
	}	
	
	relations.forEach(function(relation, i){
		leftAlias = '_' + (length-i);
		rightAlias = '_' + (length-i-1);
		addSql(relation);

	});

	return sql;
}

module.exports = newJoinSql;
