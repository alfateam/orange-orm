var newJoinCore = require('./newShallowJoinSqlCore');

function negotiateLimitFilter(filter,limit,rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	if (!limit)	
		return filter;
	var sql = 'exists (' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	sql += newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) + ')';
	return sql;
}

module.exports = negotiateLimitFilter;