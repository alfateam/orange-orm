var newColumnSql = require('../../table/query/singleQuery/newColumnSql');
var newWhereSql = require('../../table/query/singleQuery/newWhereSql');
var newJoinSql = require('../../table/query/singleQuery/newJoinSql');
var newParameterized = require('../../table/query/newParameterized');

function _new(table,filter,span, alias,orderBy,limit,offset) {

	var name = table._dbName;
	var columnSql = newColumnSql(table,span,alias,true);
	var joinSql = newJoinSql(span, alias);
	var whereSql = newWhereSql(table,filter,alias);
	if (limit)
		limit = limit + ' ';

	var groupBy = '';

	if (Object.keys(span.aggregates).length > 0) {
		groupBy = ' group by';
		groupBy = ' group by torder.id, torder.orderDate, torder.customerId';
		// groupBy = ' group by torder.id, torder.orderDate, torder.customerId, tordercustomer.id, tordercustomer.name, tordercustomer.balance, tordercustomer.isActive';
		// for (let i = 0; i < table._primaryColumns.length; i++) {
		// 	const col = table._primaryColumns[i];
		// 	groupBy += ` ${alias}.${col._dbName}`;
		// }
	}
	return newParameterized('select ' + limit + columnSql + ' from ' + name + ' ' + alias).append(joinSql).append(whereSql).append(groupBy + orderBy + offset);

}

module.exports = _new;