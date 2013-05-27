function _new(table,alias) {
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table.columns;
	var sql = aliasDot + columns[0].name;
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + columns[i].name;
	};
	return sql;
}

module.exports = _new;