var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');

function newJoinSql(relations, depth) {
	var leftAlias,
		rightAlias;
	var relation;
	var c = {};
	var sql = '';

	c.visitJoin = function(relation) {
		sql = newShallowJoinSql(relation.parentTable,relation.childTable._primaryColumns,relation.columns,leftAlias,rightAlias).prepend(' INNER').prepend(sql);
	};

	c.visitOne = function(relation) {
		innerJoin(relation);
	};

	c.visitMany = c.visitOne;

	function innerJoin(relation) {
		var joinRelation = relation.joinRelation;
		var table = joinRelation.childTable;
		var rightColumns = table._primaryColumns;
		var leftColumns = joinRelation.columns;

		sql = newShallowJoinSql(table,leftColumns,rightColumns,leftAlias,rightAlias).prepend(' INNER').prepend(sql);
	}

	for (let i = relations.length-1; i > depth; i--) {
		leftAlias = 'x' + (i+1);
		rightAlias = 'x' + i;
		relation = relations[i];
		relation.accept(c);
	}
	return sql;
}

module.exports = newJoinSql;
