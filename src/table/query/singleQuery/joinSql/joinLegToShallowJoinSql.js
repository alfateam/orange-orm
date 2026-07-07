var newShallowJoinSql = require('./newShallowJoinSql');

function toJoinSql(context,leg,alias,childAlias) {
	var columns = leg.columns;
	var childTable = leg.span.table;
	return newShallowJoinSql(context,childTable,columns,childTable._primaryColumns,alias,childAlias,leg.span.where,leg.span).prepend(' LEFT');
}

module.exports = toJoinSql;
