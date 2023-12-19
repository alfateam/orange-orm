var newShallowColumnSql = require('./newShallowColumnSql');
var newJoinedColumnSql = _initJoinedColumnSql;

function sql(leg,alias,ignoreNull) {
	var span = leg.span;
	var shallowColumnSql = newShallowColumnSql(span.table,alias, span, ignoreNull);
	var joinedColumnSql = newJoinedColumnSql(span,alias,ignoreNull);
	return ',' + shallowColumnSql + joinedColumnSql;
}

function _initJoinedColumnSql(span,alias,ignoreNull) {
	newJoinedColumnSql = require('./newJoinedColumnSql');
	return newJoinedColumnSql(span,alias,ignoreNull);
}

module.exports = sql;