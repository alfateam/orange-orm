var newWhereSql = require('./singleQuery/newWhereSql');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var newParameterized = require('./newParameterized');
var getSessionContext = require('../getSessionContext');

function _new(table, filter, span, alias, orderBy, limit) {
	//unused ?
	if (!limit)
		return;
	var whereSql = newWhereSql(table, filter, alias);
	var safeLimit = negotiateLimit(limit);
	var sql;
	if (getSessionContext().limit === 'TOP') {
		safeLimit = safeLimit.replace('limit', 'top');
		sql = 'select ' + safeLimit + ' * from ' + table._dbName + ' ' + alias + whereSql + orderBy;
	}
	sql = 'select * from ' + table._dbName + ' ' + alias + whereSql + orderBy + safeLimit;

	return newParameterized(sql, filter.parameters);
}

module.exports = _new;
