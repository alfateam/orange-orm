const getSessionSingleton = require('../table/getSessionSingleton');

function insertSql(table, row, options) {
	const quote = getSessionSingleton('quote');
	let columnNames = [];
	let regularColumnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];
	let sql = 'INSERT INTO ' + quote(table._dbName) + ' ';
	addDiscriminators();
	addColumns();
	if (columnNames.length === 0) {
		sql += 'VALUES ()';
	} else {
		sql = sql + '(' + columnNames.join(',') + ') ' + 'VALUES (' + values.join(',') + ')' + onDuplicateKeyUpdate();
	}
	return sql;

	function onDuplicateKeyUpdate() {
		if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
			return ` ON DUPLICATE KEY UPDATE ${conflictColumnUpdateSql} `;
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
			regularColumnNames.push(columnName);
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(columnName);
				values.push('%s');
				addConflictUpdate(column);
			}
		}
		if (conflictColumnUpdates.length === 0) {
			const column = table._primaryColumns[0];
			const columnName = quote(column._dbName);
			conflictColumnUpdates.push(`${columnName}=VALUES(${columnName})`);
		}
		conflictColumnUpdateSql = conflictColumnUpdates.join(',');

		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			const columnName = quote(column._dbName);
			const tableName = quote(table._dbName);
			if (concurrency === 'overwrite') {
				conflictColumnUpdates.push(`${columnName}=VALUES(${columnName})`);
			} else if (concurrency === 'optimistic') {
				conflictColumnUpdates.push(`${columnName} = CASE WHEN ${tableName}.${columnName} <> VALUES(${columnName}) THEN CAST('12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' AS SIGNED) ELSE ${tableName}.${columnName} END`);
			}
		}
	}
}

module.exports = insertSql;
