var newDiscriminatorSql = require('./newDiscriminatorSql');
var newParameterized = require('../../newParameterized');
var quote = require('../../../quote');

function _new(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,filter) {
	leftAlias = quote(leftAlias);
	rightAlias = quote(rightAlias);
	var sql = '';
	var delimiter = '';
	for (var i = 0; i < leftColumns.length; i++) {
		addColumn(i);
		delimiter = ' AND ';
	}

	function addColumn(index) {
		var leftColumn = leftColumns[index];
		var rightColumn = rightColumns[index];
		sql += delimiter + leftAlias + '.' + quote(leftColumn._dbName) + '=' + rightAlias + '.' + quote(rightColumn._dbName);
	}

	sql += newDiscriminatorSql(rightTable,rightAlias);
	var result = newParameterized(sql);
	if (filter)
		result = result.append(delimiter).append(filter);
	return result;
}

module.exports = _new;