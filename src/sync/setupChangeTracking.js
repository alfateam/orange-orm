function buildChangeTrackingSql(tables, options = {}) {
	const changeTable = normalizeChangeTable(options.changeTable);
	const appliedMutationsTable = normalizeAppliedMutationsTable(options.appliedMutationsTable);
	const statements = [
		buildCreateChangeTableSql(changeTable),
		buildCreateAppliedMutationsTableSql(appliedMutationsTable)
	];
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

	return { statements, sql: statements.join('\n\n') + '\n', trackedTables, changeTable, appliedMutationsTable };
}

async function setupChangeTracking(db, tables, options = {}) {
	if (!db || typeof db.query !== 'function')
		throw new Error('Orange: setupChangeTracking requires a connected db with a query method.');
	const { statements, trackedTables, changeTable, appliedMutationsTable } = buildChangeTrackingSql(tables, options);
	for (const statement of statements) {
		if (!statement.trim())
			continue;
		await db.query(statement);
	}
	return { trackedTables, changeTable, appliedMutationsTable };
}

// PostgreSQL/PGlite readiness belongs beside the implementation that installs
// tracking. Application code need not know trigger names, counts or log columns.
async function assertSyncReady(db, options = {}) {
	if (!db || typeof db.query !== 'function' || !db.tables)
		throw new Error('Orange: assertSyncReady requires a connected mapped database.');
	const changeTable = normalizeChangeTable(options.changeTable);
	const appliedTable = normalizeAppliedMutationsTable(options.appliedMutationsTable);
	await db.query(`SELECT id, table_name, op, pk_json, ts FROM ${quoteQualified(changeTable)} LIMIT 0`);
	await db.query(`SELECT client_id, mutation_id, applied_at, result_json FROM ${quoteQualified(appliedTable)} LIMIT 0`);
	const visited = new Set();
	for (const table of Object.values(db.tables)) {
		const name = table && table._dbName;
		if (!name || isChangeTable(name, changeTable) || !(table._primaryColumns || []).length || visited.has(name))
			continue;
		visited.add(name);
		// pg_catalog remains visible to SELECT-only runtime roles.
		const triggers = await db.query({
			sql: 'SELECT tgname AS name, tgtype AS type, tgenabled AS enabled FROM pg_catalog.pg_trigger WHERE tgrelid = to_regclass($1) AND NOT tgisinternal',
			parameters: [quoteQualified(name)]
		});
		for (const [operation, type] of [['insert', 5], ['update', 17], ['delete', 9]]) {
			if (!triggers.some(trigger => trigger.name === buildTriggerName(name, operation)
				&& Number(trigger.type) === type && ['O', 'A'].includes(trigger.enabled)))
				throw new Error(`Orange sync tracking is missing or disabled for ${name} (${operation}). Run orange-orm sync:setup before starting the server.`);
		}
	}
}

function normalizeChangeTable(changeTable) {
	return (changeTable && String(changeTable).trim()) || 'orange_changes';
}

function normalizeAppliedMutationsTable(appliedMutationsTable) {
	return (appliedMutationsTable && String(appliedMutationsTable).trim()) || 'orange_sync_applied_mutations';
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

function buildCreateAppliedMutationsTableSql(appliedMutationsTable) {
	const qualifiedAppliedMutationsTable = quoteQualified(appliedMutationsTable);
	return [
		`CREATE TABLE IF NOT EXISTS ${qualifiedAppliedMutationsTable} (`,
		'\tclient_id TEXT NOT NULL,',
		'\tmutation_id TEXT NOT NULL,',
		'\tapplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
		'\tresult_json JSONB NOT NULL,',
		'\tPRIMARY KEY (client_id, mutation_id)',
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
	setupChangeTracking,
	assertSyncReady
};
