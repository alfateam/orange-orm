function outputInsertedSql(context, table) {
	let separator = '';
	let result = 'OUTPUT ';
	for (let i = 0; i < table._columns.length; i++) {
		result += separator + formatColumn(table._columns[i]);
		separator = ',';
	}
	return result;

	function formatColumn(column) {
		if (column.formatOut)
			return `${column.formatOut(context, 'INSERTED')} AS [${column._dbName}]`;
		else
			return `INSERTED.[${column._dbName}]`;
	}
}



module.exports = outputInsertedSql;
