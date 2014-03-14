var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');

function newJoinSql(relations) {
	if (relations.length == 1)
		return  ' ';
	var relation;
	var c = {};
	var i;
	var sql = '';

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		innerJoin(leftColumns,rightColumns);
	}

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;		
		var leftColumns = joinRelation.childTable._primaryColumns;
		innerJoin(leftColumns,rightColumns);
	}

	c.visitMany = c.visitOne;

	function innerJoin(leftColumns,rightColumns) {
		var table = relation.childTable;
		var leftAlias = '_' + (i-1);
		var rightAlias = '_' + i;

		sql += ' INNER' + newShallowJoinSql(table,leftColumns,rightColumns,leftAlias,rightAlias);	
	}

	for (i = 1; i < relations.length; i++) {
		relation = relations[i];
		relation.accept(c);
	};
	return sql;
};

module.exports = newJoinSql;
