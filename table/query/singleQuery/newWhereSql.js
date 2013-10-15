function newWhereSql(filter) {
	var sql = filter.sql();
	if (sql)
		return 'where ' + sql;
	return '';	
}

module.exports = newWhereSql;