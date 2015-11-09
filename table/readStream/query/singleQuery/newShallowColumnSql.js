var util = require('util');

function _new(table,alias) {
	var columnFormat = '%s as "%s"';
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table._columns;
	var sql = aliasDot + encodeColumn(0);
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + encodeColumn(i);
	}
	return sql;

	function encodeColumn(i) {
		var column = columns[i];
		return util.format(columnFormat, column._dbName, column.alias);
	}
}

module.exports = _new;