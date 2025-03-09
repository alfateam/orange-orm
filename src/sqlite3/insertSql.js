const quote = require('./quote');

function insertSql(_context, table, row, options) {
	let columnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];

	let sql = 'INSERT INTO ' + quote(table._dbName) + ' ';
	addDiscriminators();
	addColumns();

	if (columnNames.length === 0) {
		sql += 'DEFAULT VALUES';
	} else {
		sql = sql + '(' + columnNames.join(',') + ') ' + 'VALUES (' + values.join(',') + ')' + onConflict();
	}

	return sql;

	function onConflict() {
		if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
			const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
			return ` ON CONFLICT(${primaryKeys}) ${conflictColumnUpdateSql}`;
		} else {
			return '';
		}
	}

	function addDiscriminators() {
		let discriminators = table._columnDiscriminators;
		for (let i = 0; i < discriminators.length; i++) {
			let parts = discriminators[i].split('=');
			columnNames.push(quote(parts[0]));
			values.push(parts[1]);
		}
	}

	function addColumns() {
		let conflictColumnUpdates = [];
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			const columnName = quote(column._dbName);
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(columnName);
				values.push('%s');
				addConflictUpdate(column);
			}
		}
		if (conflictColumnUpdates.length === 0)
			conflictColumnUpdateSql =  'DO NOTHING';
		else
			conflictColumnUpdateSql = 'DO UPDATE SET ' + conflictColumnUpdates.join(',');

		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			const tableName = table._dbName;
			const columnName = quote(column._dbName);
			if (concurrency === 'overwrite') {
				conflictColumnUpdates.push(`${columnName}=excluded.${columnName}`);
			} else if (concurrency === 'optimistic')
				conflictColumnUpdates.push(`${columnName} = CASE WHEN ${tableName}.${columnName} <> excluded.${columnName} THEN '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' ELSE ${tableName}.${columnName} END`);
		}
	}
}

module.exports = insertSql;
