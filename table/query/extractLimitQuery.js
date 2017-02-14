var newWhereSql = require('./singleQuery/newWhereSql');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var newParameterized = require('./newParameterized');

function _new(table, filter, span, alias, orderBy, limit) {
    if (!limit)
        return;
    var whereSql = newWhereSql(table, filter, alias);
    var safeLimit = negotiateLimit(limit);
    var sql = 'select * from ' + table._dbName + ' ' + alias + whereSql + orderBy + safeLimit;

    return newParameterized(sql, filter.parameters);
}

module.exports = _new;
