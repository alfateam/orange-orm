const getSessionSingleton = require('../../../getSessionSingleton');

function _new(table, alias, span, ignoreNulls) {
	const quote = getSessionSingleton('quote');
	const quotedAlias = quote(alias);
	let columnsMap = span.columns;
	var columns = table._columns;
	var sql = '';
	var separator = '';

	for (let i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator + formatColumn(column) + ' as ' + quote('s' + alias + i);
			separator = ',';
		}
		else if (!ignoreNulls) {
			sql = sql + separator + 'null as ' + quote('s' + alias + i);
			separator = ',';
		}
	}

	for (let name in span.aggregates || {}) {
		sql = sql + separator + span.aggregates[name].expression(name);
		separator = ',';
	}

	return sql;

	function formatColumn(column) {
		const formatted = column.formatOut ? column.formatOut(quotedAlias) : quotedAlias + '.' + column._dbName;
		if (column.dbNull === null)
			return formatted;
		else {
			const encoded = column.encode.unsafe(column.dbNull);
			return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
		}
	}
}

module.exports = _new;