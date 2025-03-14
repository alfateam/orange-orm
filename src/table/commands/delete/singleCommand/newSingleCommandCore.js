var getSessionSingleton = require('../../../getSessionSingleton');

function newSingleCommandCore(context, table, filter, alias) {
	var c = {};

	c.sql = function() {
		var whereSql = filter.sql();
		if (whereSql)
			whereSql = ' where ' + whereSql;
		var deleteFromSql = getSessionSingleton(context, 'deleteFromSql');
		return deleteFromSql(table, alias, whereSql);
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = newSingleCommandCore;