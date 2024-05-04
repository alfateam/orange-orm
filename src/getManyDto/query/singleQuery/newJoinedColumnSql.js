var util = require('util');
//todo delete
function _new(table,alias,span) {
	let columnsMap = span.columns;
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	var separator = '';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!columnsMap || (columnsMap.get(column))) {
			if (column.dbNull === null)
				sql = sql + separator + alias + '.' + util.format(columnFormat, column._dbName, column.alias);
			else {
				const encoded = column.encode.unsafe(column.dbNull);
				sql = sql + separator + `CASE WHEN ${alias}.${column._dbName}=${encoded} THEN null ELSE ${alias}.${column._dbName} END as ${column.alias}`;
			}
			separator = ',';
		}
	}

	return sql;
}

module.exports = _new;