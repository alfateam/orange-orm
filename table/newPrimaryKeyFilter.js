function primaryKeyFilter(table) {
	var primaryColumns = table._primaryColumns;
	var key = arguments[1];
	var filter = primaryColumns[0].equal(key);
	for (var i = 1; i < primaryColumns.length; i++) {
		key = arguments[i+1];
		var colFilter = primaryColumns[i].equal(key);
		filter = filter.and(colFilter);
	}
	return filter;
}

module.exports = primaryKeyFilter;
