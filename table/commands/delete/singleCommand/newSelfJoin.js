var newShallowJoinSqlCore = require('../../../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newJoinedColumnSql(table, leftAlias, rightAlias) {
	var columns = table._primaryColumns;
	return newShallowJoinSqlCore(table, columns, columns, leftAlias, rightAlias);	
};

module.exports = newJoinedColumnSql;