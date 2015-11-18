var util = require('util');

function _new(table,alias) {
	var columnFormat = "'%s',%s.%s";
	var columns = table._columns;
	var sql = '';
	var separator = '';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable))
			sql = sql + separator + util.format(columnFormat, column.alias, alias, column._dbName);
		separator = ',';
	}
	return sql;
}

module.exports = _new;