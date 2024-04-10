var newParameterized = require('../table/query/newParameterized');
var insertSql = require('./insertSql');
var util = require('util');

function newInsertCommandCore(table, row, options = {}) {
	var parameters = [];
	var values = [insertSql(table, row, options)];

	var columns = table._columns;
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		var alias = column.alias;
		if (row['__' + column.alias] !== undefined) {
			var encoded = column.encode(row[alias]);
			if (encoded.parameters.length > 0) {
				values.push('?');
				parameters.push(encoded.parameters[0]);
			} else
				values.push(encoded.sql());
		}
	}

	var sql = util.format.apply(null, values);
	return newParameterized(sql, parameters);
}

module.exports = newInsertCommandCore;
