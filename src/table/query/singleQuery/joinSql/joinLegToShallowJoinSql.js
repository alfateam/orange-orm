var newShallowJoinSql = require('./newShallowJoinSql');

function toJoinSql(leg,alias,childAlias) {
	var columns = leg.columns;
	var childTable = leg.span.table;
	return newShallowJoinSql(childTable,columns,childTable._primaryColumns,alias,childAlias,leg.span.where).prepend(' LEFT');
}

module.exports = toJoinSql;