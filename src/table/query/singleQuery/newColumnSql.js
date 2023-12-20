var newShallowColumnSql = require('./columnSql/newShallowColumnSql');
var newJoinedColumnSql = require('./columnSql/newJoinedColumnSql');

module.exports = function(table,span,alias,ignoreNull) {
	var shallowColumnSql = newShallowColumnSql(table,alias, span, ignoreNull);
	var joinedColumnSql = newJoinedColumnSql(span,alias, ignoreNull);
	return shallowColumnSql + joinedColumnSql;
};