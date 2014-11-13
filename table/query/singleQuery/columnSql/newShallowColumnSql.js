function _new(table,alias) {
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table._columns;
	var sql = aliasDot + encodeColumn(0);
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + encodeColumn(i);
	}
	return sql;

	function encodeColumn(i) {
		return columns[i]._dbName + ' as s' + alias + i;
	}
}

module.exports = _new;