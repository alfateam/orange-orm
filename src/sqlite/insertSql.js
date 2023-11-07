function insertSql(table, row, options) {
	let columnNames = [];
	let regularColumnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];

	let sql = 'INSERT INTO ' + table._dbName + ' ';
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
			const primaryKeys = table._primaryColumns.map(x => x._dbName).join(',');
			return ` ON CONFLICT(${primaryKeys}) ${conflictColumnUpdateSql}`;
		} else {
			return '';
		}
	}

	function addDiscriminators() {
		let discriminators = table._columnDiscriminators;
		for (let i = 0; i < discriminators.length; i++) {
			let parts = discriminators[i].split('=');
			columnNames.push(parts[0]);
			values.push(parts[1]);
		}
	}

	function addColumns() {
		let conflictColumnUpdates = [];
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			regularColumnNames.push(column._dbName);
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(column._dbName);
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
			if (concurrency === 'overwrite') {
				conflictColumnUpdates.push(`${column._dbName}=excluded.${column._dbName}`);
			} else if (concurrency === 'optimistic')
				conflictColumnUpdates.push(`${column._dbName} = CASE WHEN ${table._dbName}.${column._dbName} <> excluded.${column._dbName} THEN '12345678-1234-1234-1234-123456789012Conflict when updating ${column._dbName}12345678-1234-1234-1234-123456789012' ELSE ${table._dbName}.${column._dbName} END`);
		}
	}
}

module.exports = insertSql;
