var newShallowColumnSql = require('./columnSql/newShallowColumnSql');
var newJoinedColumnSql = require('./columnSql/newJoinedColumnSql');

module.exports = function(table,span,alias) {
	var shallowColumnSql = newShallowColumnSql(table,alias, span);
	var joinedColumnSql = newJoinedColumnSql(span,alias);
	return shallowColumnSql + joinedColumnSql;
};