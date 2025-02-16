const newParameterized = require('../query/newParameterized');
const getSqlTemplate = require('./insert/getSqlTemplate');
const formatString = require('../../format');

function newInsertCommandCore(context, table, row, options = {}) {
	let parameters = [];
	let values = [getSqlTemplate(context, table, row, options)];

	let columns = table._columns;
	for (let i = 0; i < columns.length; i++) {
		let column = columns[i];
		let alias = column.alias;
		if (row['__' + column.alias] !== undefined) {
			let encoded = column.encode(context, row[alias]);
			if (encoded.parameters.length > 0) {
				values.push('?');
				parameters.push(encoded.parameters[0]);
			} else
				values.push(encoded.sql());
		}
	}

	let sql = formatString.apply(null, values);
	return newParameterized(sql, parameters);
}

module.exports = newInsertCommandCore;