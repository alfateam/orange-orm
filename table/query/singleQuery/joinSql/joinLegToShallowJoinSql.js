var newShallowJoinSql = require('./newShallowJoinSql');

function toJoinSql(leg,alias,childAlias) {
	var parentTable = leg.table;
	var columns = leg.columns;
	var childTable = leg.span.table;
	return ' LEFT' + newShallowJoinSql(childTable,columns,childTable._primaryColumns,alias,childAlias);
}

module.exports = toJoinSql;