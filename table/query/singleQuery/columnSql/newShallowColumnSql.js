function _new(table,alias) {
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table.columns;
	var sql = aliasDot + columns[0].dbName;
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + columns[i].dbName;
	};
	return sql;
}

module.exports = _new;