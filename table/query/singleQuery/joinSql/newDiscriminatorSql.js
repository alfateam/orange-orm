var newDiscriminatorSqlCore = require('../newDiscriminatorSql');

function newDiscriminatorSql(table, alias) {
	var result = newDiscriminatorSqlCore(table,alias);
	if (result)
		return ' AND' + result;
	return result;

}

module.exports = newDiscriminatorSql;