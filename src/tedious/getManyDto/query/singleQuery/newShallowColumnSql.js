function _new(table,alias, span) {
	let columnsMap = span.columns;
	var columns = table._columns;
	var sql = '';
	var separator = '';

	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator  + formatColumn(column) + ' as ' + column.alias;
			separator = ',';
		}
	}
	return sql;

	function formatColumn(column) {

		const formatted = column.format && column.tsType !== 'DateColumn' ? column.format(alias) : alias + '.' + column._dbName;
		if (column.dbNull === null)
			return formatted;
		else {
			const encoded = column.encode.unsafe(column.dbNull);
			return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
		}

	}
}

module.exports = _new;