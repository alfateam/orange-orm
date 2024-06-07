var util = require('util');
const getSessionSingleton = require('../../../getSessionSingleton');

function _new(table, alias, span) {
	const quote = getSessionSingleton('quote');
	let columnsMap = span.columns;
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	alias = quote(alias);
	var separator = quote(alias) + '.';

	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator + util.format(columnFormat, quote(column._dbName), column.alias);
			separator = ',' + alias + '.';
		}
	}
	return sql;
}

module.exports = _new;