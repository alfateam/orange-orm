function newWhereSql(filter) {
	if (filter.isEmpty())
		return '';
	return 'where ' + filter.sql();
}

module.exports = newWhereSql;