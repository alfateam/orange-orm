const quote = require('./quote');

function lastInsertedSql(table) {
	let separator = '';
	let result = 'RETURNING ';
	for (let i = 0; i < table._columns.length; i++) {
		result += separator + quote(table._columns[i]._dbName);
		separator = ',';
	}
	return result;
}

module.exports = lastInsertedSql;