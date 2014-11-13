var getSessionSingleton = require('../../../getSessionSingleton');

function newSingleCommandCore(table,filter,alias) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var deleteFromSql = getSessionSingleton('deleteFromSql');
		var sql =  deleteFromSql(name, alias);
		var filterSql = filter.sql();
		if (filterSql)
			sql += ' where ' + filterSql;
		return sql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = newSingleCommandCore;