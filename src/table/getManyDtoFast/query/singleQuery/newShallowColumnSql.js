var util = require('util');

function _new(table, alias, span) {
	let columnsMap = span.columns;
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	var separator = alias + '.';


	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			sql = sql + separator + util.format(columnFormat, column._dbName, column.alias);
			separator = ',' + alias + '.';
		}
	}
	return sql;
}

module.exports = _new;