function extractOrderBy(table, alias, orderBy) {
	if (orderBy)
		return orderBy;	
	var length = table._primaryColumns.length;
	orderBy = [];
	for (var i = 0; i < length; i++) {
		orderBy.push(alias + '.' + table._primaryColumns[i]._dbName);
	}
	return ' order by ' + orderBy.join(',');
}

module.exports = extractOrderBy;