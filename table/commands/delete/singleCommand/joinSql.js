var newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');

function newJoinSql(relations) {
	var length = relations.length;
	if (relations.length == 1)
		return  '';
	var leftAlias,
		rightAlias;
	var c = {};
	var i;
	var sql = '';

	function addSql(relation) {
		sql += ' INNER' + newShallowJoinSql(relation.parentTable,relation.childTable._primaryColumns,relation.columns,leftAlias,rightAlias);	
	}	
	
	relations.forEach(function(relation, i){
		leftAlias = '_' + (length-i);
		rightAlias = '_' + (length-i-1);
		addSql(relation);

	});

	return sql;
};

module.exports = newJoinSql;
