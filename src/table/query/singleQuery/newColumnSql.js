var newShallowColumnSql = require('./columnSql/newShallowColumnSql');
var newJoinedColumnSql = require('./columnSql/newJoinedColumnSql');

module.exports = function(context,table,span,alias,ignoreNull) {
	var shallowColumnSql = newShallowColumnSql(context,table,alias, span, ignoreNull);
	var joinedColumnSql = newJoinedColumnSql(context, span,alias, ignoreNull);
	return shallowColumnSql + joinedColumnSql;
};