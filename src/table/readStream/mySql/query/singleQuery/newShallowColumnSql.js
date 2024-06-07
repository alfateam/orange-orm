var util = require('util');
const quote = require('../../../../quote');

function _new(table,alias) {
	var columnFormat = '\'%s\',%s.%s';
	var columns = table._columns;
	var sql = '';
	var separator = '';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable))
			sql = sql + separator + util.format(columnFormat, quote(column.alias), alias, quote(column._dbName));
		separator = ',';
	}
	return sql;
}

module.exports = _new;