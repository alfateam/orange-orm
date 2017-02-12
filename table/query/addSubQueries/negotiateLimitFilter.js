var newJoinCore = require('./newShallowJoinSqlCore');

function negotiateLimitFilter(filter,limit,rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	if (!limit)	
		return filter;
	var sql = 'exists (' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	sql += newJoinCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) + ')';
	return sql;
	// var sql = ' JOIN ' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	"INNER JOIN order order ON (order_0.lOrderId=order.oOrderId AND order.discriminatorColumn='foo' AND order.discriminatorColumn2='baz') order by order.oOrderId";
}

module.exports = negotiateLimitFilter;