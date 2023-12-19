var newShallowColumnSql = require('./singleQuery/newShallowColumnSql');
var newJoinedColumnSql = require('./singleQuery/newJoinedColumnSql');

module.exports = function(table,span,alias) {
	var shallowColumnSql = newShallowColumnSql(table,alias, span);
	var joinedColumnSql = newJoinedColumnSql(span,alias);
	return shallowColumnSql + joinedColumnSql;
};