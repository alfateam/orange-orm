var newDiscriminatorSql = require('./newDiscriminatorSql');

function newWhereSql(table,filter,alias) {
	var separator = ' where';
	var result = '';
	var sql = filter.sql();
	var discriminator = newDiscriminatorSql(table, alias);
	if (sql) {
		result = separator + ' ' + sql;
		separator = ' AND';
	}
	if(discriminator)
		result += separator + discriminator;
	return result;	
}

module.exports = newWhereSql;