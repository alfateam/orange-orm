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

	//todo
	//add outParams
	//result.resultFromOutParams = true;
	//result.outParamsLength = 2;
	var sql = util.format.apply(null, values);
	return newParameterized(sql, parameters);
}

module.exports = newInsertCommandCore;

// INSERT INTO _order (orderDate,customerId)  OUTPUT INSERTED.id,INSERTED.orderDate,INSERTED.customerId VALUES (@0,1)
// parameters: 0,[object Object],'2022-01-11T09:24:47.000'

