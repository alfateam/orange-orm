function _new(table,alias) {
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table._columns;
	var sql = aliasDot + columns[0]._dbName;
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + columns[i]._dbName;
	};
	return sql;
}

module.exports = _new;