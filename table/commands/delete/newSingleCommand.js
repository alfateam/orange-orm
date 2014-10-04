var newWhereSql = require('../../query/singleQuery/newWhereSql');
//newSingleCommand(table,filter,strategy,relations);
function _new(table,filter,strategy,relations) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var innerJoinSql = innerJoin.sql();
		var whereSql = newWhereSql(table,filter,alias);
		return 'delete from ' + name + ' ' + alias + innerJoinSql + whereSql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;