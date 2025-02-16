function primaryKeyFilter(context, table) {
	var primaryColumns = table._primaryColumns;
	var key = arguments[2];
	var filter = primaryColumns[0].equal(context, key);
	for (var i = 2; i < primaryColumns.length; i++) {
		key = arguments[i+1];
		var colFilter = primaryColumns[i].equal(context, key);
		filter = filter.and(context, colFilter);
	}
	return filter;
}

module.exports = primaryKeyFilter;
