let lastInsertedSql = require('./lastInsertedSql');
let getSessionContext = require('../table/getSessionContext');
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
	if (columnNames.length === 0)
		sql += `${outputInserted()}DEFAULT VALUES ${lastInsertedSql(table)}`;
	else
		sql = sql + '(' + columnNames.join(',') + ') ' + outputInserted() + 'VALUES (' + values.join(',') + ')' + onConflict() + lastInsertedSql(table);
	return sql;

	function onConflict() {
		if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
			const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
			return ` ON CONFLICT(${primaryKeys}) ${conflictColumnUpdateSql} `;
		}
		else return '';
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
		if (conflictColumnUpdates.length === 0)
			conflictColumnUpdateSql = 'DO NOTHING';
		else
			conflictColumnUpdateSql = 'DO UPDATE SET ' + conflictColumnUpdates.join(',');

		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			const columnName = quote(column._dbName);
			const tableName = quote(table._dbName);
			if (concurrency === 'overwrite')
				conflictColumnUpdates.push(`${columnName}=EXCLUDED.${columnName}`);
			else if (concurrency === 'optimistic')
				conflictColumnUpdates.push(`${columnName} = CASE WHEN ${tableName}.${columnName} <> EXCLUDED.${columnName} THEN CAST(random()::int || '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' AS INTEGER) ELSE ${tableName}.${columnName} END`);
		}
	}


	function outputInserted() {
		let context = getSessionContext();
		if (!context.lastInsertedIsSeparate && context.outputInsertedSql)
			return context.outputInsertedSql(table) + ' ';
		return '';
	}
}

module.exports = insertSql;
