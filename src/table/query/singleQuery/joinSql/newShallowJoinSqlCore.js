const newDiscriminatorSql = require('./newDiscriminatorSql');
const newParameterized = require('../../newParameterized');
const getSessionSingleton = require('../../../getSessionSingleton');

function _new(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter) {
	const quote = getSessionSingleton(context, 'quote');
	const leftAliasRaw = leftAlias;
	const rightAliasRaw = rightAlias;
	leftAlias = quote(leftAliasRaw);
	rightAlias = quote(rightAliasRaw);
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

	sql += newDiscriminatorSql(context, rightTable, rightAliasRaw);
	var result = newParameterized(sql);
	if (filter)
		result = result.append(delimiter).append(filter);
	return result;
}

module.exports = _new;
