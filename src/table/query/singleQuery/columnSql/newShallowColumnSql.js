function _new(table, alias, span, ignoreNulls) {
	let columnsMap = span.columns;
	var columns = table._columns;
	var sql = '';
	var separator = '';

	for (let i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator + formatColumn(column) + ' as s' + alias + i;
			separator = ',';
		}
		else if (!ignoreNulls) {
			sql = sql + separator + 'null as s' + alias + i;
			separator = ',';
		}
	}

	for (let name in span.aggregates || {}) {
		sql = sql + separator + span.aggregates[name].expression.sql();
	}

	return sql;

	function formatColumn(column) {
		const formatted = column.formatOut ? column.formatOut(alias) : alias + '.' + column._dbName;
		if (column.dbNull === null)
			return formatted;
		else {
			const encoded = column.encode.unsafe(column.dbNull);
			return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
		}
	}
}

module.exports = _new;