var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');
var negotiateLimit = require('../../../table/query/singleQuery/negotiateLimit');
var newParameterized = require('../../../table/query/newParameterized');

function _new(table, filter, span, alias, innerJoin, orderBy, limit, offset = '') {

		var name = table._dbName;
		var columnSql = newColumnSql(table, alias, span);
		var whereSql = newWhereSql(table, filter, alias);
		var safeLimit = negotiateLimit(limit);
		innerJoin = innerJoin ? innerJoin.prepend(' RIGHT') : newParameterized('');
		return newParameterized('select ' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + alias)
		.append(innerJoin)
		.append(whereSql)
		.append(orderBy + offset);

}

module.exports = _new;