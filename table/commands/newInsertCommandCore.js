var newParameterized = require('../query/newParameterized');
var getSqlTemplate = require('./insert/getSqlTemplate');
var util = require('util');

function newInsertCommandCore(table, row) {
	var parameters = [];
	var values = [getSqlTemplate(table, row)];

	var columns = table._columns;
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		var alias = column.alias;
		console.log('.....................................................')
		console.log(column.default)
		console.log(row['__' + column.alias])
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