const outputInsertedSql = require('./outputInsertedSql');

function insertSql(table, row, options) {
	let columnNames = [];
	let regularColumnNames = [];
	let conflictColumnUpdateSql = '';
	let values = [];
	addDiscriminators();
	addColumns();

	const matched = whenMatched();
	let sql;
	if (matched)
		sql = `MERGE INTO ${table._dbName} target USING (SELECT ${values.join(',')} FROM DUAL) source ON (${join()}) WHEN MATCHED THEN ${matched} WHEN NOT MATCHED THEN ${whenNotMatched()} ${outputInsertedSql(table)}`;
	else
		sql = `MERGE INTO ${table._dbName} target USING (SELECT ${values.join(',')} FROM DUAL) source ON (${join()}) WHEN NOT MATCHED THEN ${whenNotMatched()} ${outputInsertedSql(table)}`;
	return sql;

	function join() {
		const discriminators = table._columnDiscriminators.map(x => {
			const name = x.split('=')[0];

			return `target.${name}=source.${name}`;
		});
		const primaries = table._primaryColumns.map(x => `target.${x._dbName}=source.${x._dbName}`);
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
			columnNames.push(parts[0]);
			values.push(`${parts[1]} ${parts[0]}`);
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
				values.push(`%s ${column.alias}`);
				if (!column.isPrimary)
					addConflictUpdate(column);
			}
		}

		if (conflictColumnUpdates.length > 0)
			conflictColumnUpdateSql = 'UPDATE SET ' + conflictColumnUpdates.join(',');


		function addConflictUpdate(column) {
			let concurrency = options[column.alias]?.concurrency || options.concurrency;
			if (concurrency === 'overwrite')
				conflictColumnUpdates.push(`target.${column._dbName}=source.${column._dbName}`);
			else if (concurrency === 'optimistic')
				// conflictColumnUpdates.push(`target.${column._dbName} = CASE WHEN target.${column._dbName} <> source.${column._dbName} THEN RAISE_APPLICATION_ERROR(-20001, 'Conflict when updating ${column._dbName}') ELSE target.${column._dbName} END`);
				conflictColumnUpdates.push(`target.${column._dbName} = CASE WHEN target.${column._dbName} <> source.${column._dbName} THEN 1/0 ELSE target.${column._dbName} END`);

		}
	}
}

module.exports = insertSql;
