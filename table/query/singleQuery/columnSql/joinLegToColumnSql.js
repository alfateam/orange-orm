var newShallowColumnSql = require('./newShallowColumnSql');
var newJoinedColumnSql = _initJOinedColumnSql;

function sql(leg,alias) {
	var span = leg.span;
	var shallowColumnSql = newShallowColumnSql(span.table,alias, span);
	var joinedColumnSql = newJoinedColumnSql(span,alias);
	return ',' + shallowColumnSql + joinedColumnSql;
}

function _initJOinedColumnSql(span,alias) {
	newJoinedColumnSql = require('./newJoinedColumnSql');
	return newJoinedColumnSql(span,alias);
}

module.exports = sql;