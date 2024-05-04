var newShallowJoinSql = require('../../query/singleQuery/joinSql/newShallowJoinSql');

function newJoinSql(relations, prefix) {
	var leftAlias,
		rightAlias;
	var relation;
	var c = {};
	var sql = '';

	c.visitJoin = function(relation) {
		sql = newShallowJoinSql(relation.childTable,relation.columns,relation.parentTable._primaryColumns,leftAlias,rightAlias).prepend(' LEFT').prepend(sql);
	};

	c.visitOne = function(relation) {
		innerJoin(relation);
	};

	c.visitMany = c.visitOne;

	function innerJoin(relation) {
		var joinRelation = relation.joinRelation;
		var table = joinRelation.parentTable;
		var leftColumns = table._primaryColumns;
		var rightColumns = joinRelation.columns;

		sql = newShallowJoinSql(table,leftColumns,rightColumns,leftAlias,rightAlias).prepend(' LEFT').prepend(sql);
	}

	for (let i = 0; i < relations.length; i++) {
		leftAlias = i === 0 ? relations[i].parentTable._rootAlias || relations[i].parentTable._dbName: prefix + i;
		rightAlias = prefix + i;
		relation = relations[i];
		relation.accept(c);
	}
	return sql;
}

module.exports = newJoinSql;
