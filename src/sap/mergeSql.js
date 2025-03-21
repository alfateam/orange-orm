const quote = require('./quote');

function insertSql(table, row, options) {
	let columnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];
	addDiscriminators();
	addColumns();

	const matched = whenMatched();
	let sql;
	if (matched)
		sql = `MERGE INTO ${quote(table._dbName)} AS target USING (SELECT ${values.join(',')}) AS source ON ${join()} WHEN MATCHED THEN ${matched} WHEN NOT MATCHED THEN ${whenNotMatched()};`;
	else
		sql = `MERGE INTO ${quote(table._dbName)} AS target USING (SELECT ${values.join(',')}) AS source ON ${join()} WHEN NOT MATCHED THEN ${whenNotMatched()};`;

	return sql;

	function join() {
		const discriminators = table._columnDiscriminators.map(x => {
			const name = quote(x.split('=')[0]);

			return `target.${name}=source.${name}`;
		});
		const primaries = table._primaryColumns.map(x => `target.${quote(x._dbName)}=source.${quote(x._dbName)}`);
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
			columnNames.push(quote(parts[0]));
			values.push(`${parts[1]} AS ${parts[0]}`);
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
				values.push(`%s AS ${quote(column.alias)}`);
				addConflictUpdate(column);
			}
		}
		if (conflictColumnUpdates.length > 0)
			conflictColumnUpdateSql = 'UPDATE SET ' + conflictColumnUpdates.join(',');

		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			const columnName = quote(column._dbName);
			if (concurrency === 'overwrite')
				conflictColumnUpdates.push(`target.${columnName}=source.${columnName}`);
			else if (concurrency === 'optimistic')
				conflictColumnUpdates.push(`target.${columnName} = CASE WHEN target.${columnName} <> source.${columnName} THEN CAST('12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' AS INTEGER) ELSE target.${columnName} END`);
		}
	}
}

module.exports = insertSql;
