function _new(table,alias, span) {
	let columnsMap = span.columns;
	var columns = table._columns;
	let sql = '';
	let prefix = '';
	for (var i = 0; i < columns.length; i++) {
		sql = sql + encodeColumn(i);
		prefix = ',' ;
	}
	return sql;

	function encodeColumn(i) {
		let column = columns[i];
		if (!columnsMap || (columnsMap.get(column)))
			return  prefix + alias + '.' + ((column.format && column.format()) || column._dbName) + ' as s' + alias + i;
		else
			return prefix + 'null as s' + alias + i;
	}
}

module.exports = _new;