var newDiscriminatorSql = require('./newDiscriminatorSql');

function _new(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	var sql = 'JOIN ' + rightTable.name + ' ' +  rightAlias + ' ON ';
	var delimiter = '(';
	for (var i = 0; i < leftColumns.length; i++) {
		addColumn(i);
		delimiter = ' AND ';
	};
	
	function addColumn(index) {
		var leftColumn = leftColumns[index];
		var rightColumn = rightColumns[index];
		sql += delimiter + leftAlias + '.' + leftColumn.name + '=' + rightAlias + '.' + rightColumn.name
	}

	sql += newDiscriminatorSql(rightTable,rightAlias) + ')';
	return sql;
}

module.exports = _new;