var newShallowColumnSql = require('./newShallowColumnSql');
var newJoinedColumnSql = require('./newJoinedColumnSql');

function sql(leg,alias) {
	var span = leg.span;
	var shallowColumnSql = newShallowColumnSql(span.table,alias);
	var joinedColumnSql = newJoinedColumnSql(span,alias);
	return ',' + shallowColumnSql + joinedColumnSql;
}

module.exports = sql;