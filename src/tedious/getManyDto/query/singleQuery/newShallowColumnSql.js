const quote = require('../../../quote');

function _new(context, table, alias, span) {
	alias = quote(alias);
	let columnsMap = span.columns;
	var columns = table._columns;
	var sql = '';
	var separator = '';

	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator + formatColumn(column) + ' as ' + quote(column.alias);
			separator = ',';
		}
	}

	for (let name in span.aggregates || {}) {
		sql = sql + separator + span.aggregates[name].expression(name);
	}

	return sql;

	function formatColumn(column) {

		const formatted = column.formatOut && column.tsType !== 'DateColumn' ? column.formatOut(context, alias) : alias + '.' + quote(column._dbName);
		if (column.dbNull === null)
			return formatted;
		else {
			const encoded = column.encode.unsafe(context, column.dbNull);
			return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
		}

	}
}

module.exports = _new;