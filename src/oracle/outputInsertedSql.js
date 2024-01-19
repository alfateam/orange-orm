function outputInsertedSql(table) {
	return '';
	let separator = '';
	let colNames = '';
	let outParams = new Array(table._columns.length).fill('?');

	for (let i = 0; i < table._columns.length; i++) {
		colNames += separator + table._columns[i]._dbName;
		separator = ',';
	}
	let result = `RETURNING ${colNames} INTO ${outParams}`;
	return result;
}

module.exports = outputInsertedSql;