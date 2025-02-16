var newShallowJoinSql = require('./newShallowJoinSql');

function toJoinSql(context,leg,alias,childAlias) {
	var parentTable = leg.table;
	var columns = leg.columns;
	var childTable = leg.span.table;
	return newShallowJoinSql(context,childTable,parentTable._primaryColumns,columns,alias,childAlias, leg.span.where).prepend(' LEFT');
}

module.exports = toJoinSql;