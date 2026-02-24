function buildChangeTrackingSql(tables, options = {}) {
	const changeTable = normalizeChangeTable(options.changeTable);
	const statements = [buildCreateChangeTableSql(changeTable)];
	let trackedTables = 0;
	const tableNames = tables ? Object.keys(tables) : [];
	for (const name of tableNames) {
		const table = tables[name];
		const dbName = table && table._dbName;
		if (typeof dbName !== 'string' || dbName.length === 0)
			continue;
		if (isChangeTable(dbName, changeTable))
			continue;

		const pkColumns = table._primaryColumns || [];
		if (pkColumns.length === 0) {
			console.warn(`Orange: skipping ${dbName} (no primary key).`);
			continue;
		}

		const qualifiedTable = quoteQualified(dbName);
		const functionName = buildFunctionName(dbName);
		const functionRef = qualifyWithSchema(dbName, functionName);
		const qualifiedChangeTable = quoteQualified(changeTable);

		const triggerInsert = buildTriggerName(dbName, 'insert');
		const triggerUpdate = buildTriggerName(dbName, 'update');
		const triggerDelete = buildTriggerName(dbName, 'delete');

		statements.push(`DROP TRIGGER IF EXISTS ${quoteIdent(triggerInsert)} ON ${qualifiedTable};`);
		statements.push(`DROP TRIGGER IF EXISTS ${quoteIdent(triggerUpdate)} ON ${qualifiedTable};`);
		statements.push(`DROP TRIGGER IF EXISTS ${quoteIdent(triggerDelete)} ON ${qualifiedTable};`);
		statements.push(`DROP FUNCTION IF EXISTS ${functionRef}();`);

		const jsonNew = buildPkJson(pkColumns, 'NEW');
		const jsonOld = buildPkJson(pkColumns, 'OLD');
		const tableNameLiteral = sqlStringLiteral(dbName);

		statements.push([
			`CREATE OR REPLACE FUNCTION ${functionRef}() RETURNS trigger AS $$`,
			'DECLARE',
			'\tv_pk_json text;',
			'BEGIN',
			'\tIF (TG_OP = \'DELETE\') THEN',
			`\t\tv_pk_json := ${jsonOld};`,
			'\tELSE',
			`\t\tv_pk_json := ${jsonNew};`,
			'\tEND IF;',
			`\tINSERT INTO ${qualifiedChangeTable}(table_name, op, pk_json, ts)`,
			`\tVALUES (${tableNameLiteral}, SUBSTRING(TG_OP, 1, 1), v_pk_json, NOW());`,
			'\tIF (TG_OP = \'DELETE\') THEN',
			'\t\tRETURN OLD;',
			'\tEND IF;',
			'\tRETURN NEW;',
			'END;',
			'$$ LANGUAGE plpgsql;'
		].join('\n'));

		statements.push(`CREATE TRIGGER ${quoteIdent(triggerInsert)} AFTER INSERT ON ${qualifiedTable} FOR EACH ROW EXECUTE FUNCTION ${functionRef}();`);
		statements.push(`CREATE TRIGGER ${quoteIdent(triggerUpdate)} AFTER UPDATE ON ${qualifiedTable} FOR EACH ROW EXECUTE FUNCTION ${functionRef}();`);
		statements.push(`CREATE TRIGGER ${quoteIdent(triggerDelete)} AFTER DELETE ON ${qualifiedTable} FOR EACH ROW EXECUTE FUNCTION ${functionRef}();`);
		trackedTables += 1;
	}

	return { statements, sql: statements.join('\n\n') + '\n', trackedTables, changeTable };
}

async function setupChangeTracking(db, tables, options = {}) {
	if (!db || typeof db.query !== 'function')
		throw new Error('Orange: setupChangeTracking requires a connected db with a query method.');
	const { statements, trackedTables, changeTable } = buildChangeTrackingSql(tables, options);
	for (const statement of statements) {
		if (!statement.trim())
			continue;
		await db.query(statement);
	}
	return { trackedTables, changeTable };
}

function normalizeChangeTable(changeTable) {
	return (changeTable && String(changeTable).trim()) || 'orange_changes';
}

function buildCreateChangeTableSql(changeTable) {
	const qualifiedChangeTable = quoteQualified(changeTable);
	return [
		`CREATE TABLE IF NOT EXISTS ${qualifiedChangeTable} (`,
		'\tid BIGSERIAL PRIMARY KEY,',
		'\ttable_name TEXT NOT NULL,',
		'\top CHAR(1) NOT NULL,',
		'\tpk_json TEXT NOT NULL,',
		'\tts TIMESTAMPTZ NOT NULL DEFAULT NOW()',
		');'
	].join('\n');
}

function isChangeTable(dbName, changeTable) {
	const dbNormalized = normalizeQualifiedName(dbName);
	const changeNormalized = normalizeQualifiedName(changeTable);
	if (dbNormalized === changeNormalized)
		return true;
	const dbTail = dbNormalized.split('.').pop();
	const changeTail = changeNormalized.split('.').pop();
	return dbTail === changeTail && (dbTail === dbNormalized || changeTail === changeNormalized);
}

function normalizeQualifiedName(name) {
	return String(name).replace(/"/g, '').trim().toLowerCase();
}

function buildFunctionName(dbName) {
	const safe = sanitizeIdent(dbName);
	return `orange_sync__${safe}__log`;
}

function buildTriggerName(dbName, op) {
	const safe = sanitizeIdent(dbName);
	return `orange_sync__${safe}__${op}`;
}

function sanitizeIdent(value) {
	return value
		.replace(/[^a-zA-Z0-9_]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase() || 'table';
}

function buildPkJson(pkColumns, rowAlias) {
	const args = [];
	for (const column of pkColumns) {
		const key = sqlStringLiteral(column.alias);
		const value = `${rowAlias}.${quoteIdent(column._dbName)}`;
		args.push(`${key}, ${value}`);
	}
	return `json_build_object(${args.join(', ')})::text`;
}

function qualifyWithSchema(dbName, ident) {
	const schema = splitSchema(dbName);
	if (!schema)
		return quoteIdent(ident);
	return `${quoteIdent(schema)}.${quoteIdent(ident)}`;
}

function splitSchema(dbName) {
	const parts = dbName.split('.');
	if (parts.length <= 1)
		return null;
	return parts[0];
}

function quoteQualified(dbName) {
	const parts = dbName.split('.').map(quoteIdent);
	return parts.join('.');
}

function quoteIdent(name) {
	return `"${String(name).replace(/"/g, '""')}"`;
}

function sqlStringLiteral(value) {
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

module.exports = {
	buildChangeTrackingSql,
	setupChangeTracking
};
