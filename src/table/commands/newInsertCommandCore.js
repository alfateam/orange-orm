var newParameterized = require('../query/newParameterized');
var getSqlTemplate = require('./insert/getSqlTemplate');
var getSqlForgetTemplate = require('./insertAndForget/getSqlTemplate');
var util = require('util');

function newInsertCommandCore(table, row, {insertAndForget = false} = {}) {
	var parameters = [];
	var values = [insertAndForget? getSqlForgetTemplate(table, row) : getSqlTemplate(table, row)];

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

// INSERT INTO _order (orderDate,customerId)  OUTPUT INSERTED.id,INSERTED.orderDate,INSERTED.customerId VALUES (@0,1)
// parameters: 0,[object Object],'2022-01-11T09:24:47.000'

