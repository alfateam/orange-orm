function outputInsertedSql(table) {
	let separator = '';
	let result = 'OUTPUT ';
	for (let i = 0; i < table._columns.length; i++) {
		result += separator + 'INSERTED.' + table._columns[i]._dbName;
		separator = ',';
	}
	return result;
}

module.exports = outputInsertedSql;