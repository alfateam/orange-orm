var util = require('util');
const quote = require('../../../../quote');

function _new(table,alias,span) {
	let columnsMap = span.columns;
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	var separator = alias + '.';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable) && (!columnsMap || (columnsMap.get(column)))) {
			sql = sql + separator + util.format(columnFormat, quote(column._dbName), quote(column.alias));
			separator = ',' + alias + '.';
		}
	}
	return sql;
}

module.exports = _new;