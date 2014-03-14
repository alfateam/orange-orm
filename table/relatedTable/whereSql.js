var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newWhereSql(relation,shallowFilter) {
	var c = {};
	var sql;

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		where(leftColumns,rightColumns);
	}

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;		
		var leftColumns = joinRelation.childTable._primaryColumns;
		where(leftColumns,rightColumns);
	}

	c.visitMany = c.visitOne;

	function where(leftColumns,rightColumns) {
		var table = relation.childTable;
		var joinCore = newShallowJoinSql(table,leftColumns,rightColumns,'_0','_1');
		sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');		
	}

	relation.accept(c);
	return sql;
};

module.exports = newWhereSql;
