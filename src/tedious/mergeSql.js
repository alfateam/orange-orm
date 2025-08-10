const outputInsertedSql = require('./outputInsertedSql');

function insertSql(context, table, row, options) {

	let columnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];
	addDiscriminators();
	addColumns();

	const matched = whenMatched();
	let sql;
	if (matched)
		sql = `MERGE INTO [${table._dbName}] AS target USING (SELECT ${values.join(',')}) AS source ON ${join()} WHEN MATCHED THEN ${matched} WHEN NOT MATCHED THEN ${whenNotMatched()} ${outputInsertedSql(context, table)};`;
	else
		sql = `MERGE INTO [${table._dbName}] AS target USING (SELECT ${values.join(',')}) AS source ON ${join()} WHEN NOT MATCHED THEN ${whenNotMatched()} ${outputInsertedSql(context, table)};`;
	return sql;

	function join() {
		const discriminators = table._columnDiscriminators.map(x => {
			const name = `[${x.split('=')[0]}]`;

			return `target.${name}=source.${name}`;
		});
		const primaries = table._primaryColumns.map(x => `target.[${x._dbName}]=source.[${x._dbName}]`);
		return [...discriminators, ...primaries].join(' AND ');
	}

	function whenMatched() {
		if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
			return conflictColumnUpdateSql;
		}
		else return '';
	}

	function whenNotMatched() {
		return `INSERT (${columnNames.join(',')}) VALUES (${columnNames.map(name => 'source.' + name)})`;
	}

	function addDiscriminators() {
		let discriminators = table._columnDiscriminators;
		for (let i = 0; i < discriminators.length; i++) {
			let parts = discriminators[i].split('=');
			columnNames.push(`[${parts[0]}]`);
			values.push(`${parts[1]} AS ${[parts[0]]}`);
		}
	}

	function addColumns() {
		let conflictColumnUpdates = [];
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(`[${column._dbName}]`);
				values.push(`%s AS [${column.alias}]`);
				addConflictUpdate(column);
			}
		}

		if (conflictColumnUpdates.length > 0)
			conflictColumnUpdateSql = 'UPDATE SET ' + conflictColumnUpdates.join(',');


		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			if (concurrency === 'overwrite')
				conflictColumnUpdates.push(`target.[${column._dbName}]=source.[${column._dbName}]`);
			else if (concurrency === 'optimistic')
				conflictColumnUpdates.push(`target.[${column._dbName}] = CASE WHEN target.[${column._dbName}] <> source.[${column._dbName}] THEN CAST('12345678-1234-1234-1234-123456789012Conflict when updating [${column._dbName}]12345678-1234-1234-1234-123456789012' AS INTEGER) ELSE target.[${column._dbName}] END`);
		}
	}
}

module.exports = insertSql;
