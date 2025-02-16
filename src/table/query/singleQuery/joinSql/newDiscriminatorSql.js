var newDiscriminatorSqlCore = require('../newDiscriminatorSql');

function newDiscriminatorSql(context, table, alias) {
	var result = newDiscriminatorSqlCore(context,table,alias);
	if (result)
		return ' AND' + result;
	return result;

}

module.exports = newDiscriminatorSql;