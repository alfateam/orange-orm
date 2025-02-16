var newParameterized = require('../table/query/newParameterized');
var insertSql = require('./insertSql');
const formatString = require('../format');

function newInsertCommandCore(context,table, row, options = {}) {
	var parameters = [];
	var values = [insertSql(context,table, row, options)];

	var columns = table._columns;
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		var alias = column.alias;
		if (row['__' + column.alias] !== undefined) {
			var encoded = column.encode(context, row[alias]);
			if (encoded.parameters.length > 0) {
				values.push('?');
				parameters.push(encoded.parameters[0]);
			} else
				values.push(encoded.sql());
		}
	}

	var sql = formatString.apply(null, values);
	return newParameterized(sql, parameters);
}

module.exports = newInsertCommandCore;
