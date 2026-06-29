const OPERATION_COLUMNS = [
	{ name: 'operation_id', sql: '"operation_id" TEXT' },
	{ name: 'operation_name', sql: '"operation_name" TEXT' },
	{ name: 'operation_json', sql: '"operation_json" TEXT' }
];

async function ensureOutboxOperationColumns(query, tableName = 'orange_sync_outbox') {
	if (typeof query !== 'function')
		return;
	let rows;
	try {
		rows = await query(`PRAGMA table_info("${String(tableName).replace(/"/g, '""')}")`);
	}
	catch (_e) {
		return;
	}
	const columns = new Set();
	const list = Array.isArray(rows) ? rows : rows && rows.rows || [];
	for (let i = 0; i < list.length; i++) {
		const name = list[i] && (list[i].name ?? list[i].NAME);
		if (typeof name === 'string')
			columns.add(name);
	}
	for (let i = 0; i < OPERATION_COLUMNS.length; i++) {
		const column = OPERATION_COLUMNS[i];
		if (columns.has(column.name))
			continue;
		try {
			await query(`ALTER TABLE "${String(tableName).replace(/"/g, '""')}" ADD COLUMN ${column.sql}`);
		}
		catch (e) {
			if (!isDuplicateColumnError(e, column.name))
				throw e;
		}
	}
}

function isDuplicateColumnError(error, columnName) {
	const message = error && error.message || '';
	return message.includes('duplicate column name')
		&& message.toLowerCase().includes(columnName.toLowerCase());
}

module.exports = ensureOutboxOperationColumns;
