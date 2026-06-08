const schemaStateTable = 'orange_schema_state';
const schemaVersion = 1;

async function ensureSyncSchema(db, client, tableNames, options = {}) {
	if (!db || typeof db.query !== 'function')
		return null;
	if (options === false || options && options.enabled === false)
		return null;
	const tables = client && client.tables;
	if (!tables || !Array.isArray(tableNames) || tableNames.length === 0)
		return null;

	const schema = buildSyncSchema(tables, tableNames);
	if (!schema.tables.length)
		return null;
	const sql = schemaToSql(schema);
	const schemaJson = stableStringify(schema);
	const checksum = checksumString(schemaJson);
	const scope = `sync:${schema.tables.map(x => x.name).join('|')}`;

	await ensureSchemaStateTable(db);
	const existing = await readSchemaState(db, scope);
	if (existing && existing.checksum !== checksum)
		throw new Error('Local sync schema does not match current map. Reset the local sync database or run a migration before syncing.');

	for (let i = 0; i < sql.statements.length; i++)
		await db.query(sql.statements[i]);

	if (!existing)
		await writeSchemaState(db, {
			scope,
			dialect: 'sqlite',
			tables: schema.tables.map(x => x.name),
			schema,
			checksum,
			sql: sql.statements.join('\n'),
			updatedAtMs: Date.now()
		});

	return { scope, schema, checksum, sql: sql.statements };
}

function buildSyncSchema(tables, tableNames) {
	const selected = Array.from(new Set(tableNames))
		.filter(name => tables[name])
		.sort();
	return {
		version: schemaVersion,
		dialect: 'sqlite',
		tables: selected.map(name => tableToSchema(name, tables[name]))
	};
}

function tableToSchema(name, table) {
	const columns = (table._columns || []).map(columnToSchema);
	return {
		name,
		dbName: table._dbName,
		columns,
		primaryKey: (table._primaryColumns || []).map(x => x._dbName)
	};
}

function columnToSchema(column) {
	return {
		name: column.alias,
		dbName: column._dbName,
		type: columnType(column),
		primary: column.isPrimary === true,
		notNull: column._notNull === true,
		notNullExceptInsert: column._notNullExceptInsert === true
	};
}

function columnType(column) {
	if (column.tsType === 'NumberColumn')
		return 'number';
	if (column.tsType === 'BooleanColumn')
		return 'boolean';
	if (column.tsType === 'BigintColumn')
		return 'bigint';
	if (column.tsType === 'BinaryColumn')
		return 'binary';
	if (column.tsType === 'JSONColumn')
		return 'json';
	if (column.tsType === 'UUIDColumn')
		return 'uuid';
	if (column.tsType === 'DateColumn' && column.hasTimeZone)
		return 'datetime-tz';
	if (column.tsType === 'DateColumn')
		return 'datetime';
	return 'string';
}

function schemaToSql(schema) {
	return {
		statements: schema.tables.map(tableToCreateSql)
	};
}

function tableToCreateSql(table) {
	const hasCompositePrimaryKey = table.primaryKey.length > 1;
	const parts = table.columns.map(column => columnToSql(column, { hasCompositePrimaryKey }));
	if (table.primaryKey.length > 1)
		parts.push(`PRIMARY KEY (${table.primaryKey.map(quoteIdent).join(', ')})`);
	return [
		`CREATE TABLE IF NOT EXISTS ${quoteIdent(table.dbName)} (`,
		parts.map(x => `  ${x}`).join(',\n'),
		');'
	].join('\n');
}

function columnToSql(column, options = {}) {
	const parts = [quoteIdent(column.dbName), sqliteType(column.type)];
	if (!options.hasCompositePrimaryKey && column.primary && column.type === 'number')
		parts.push('PRIMARY KEY');
	else if (!options.hasCompositePrimaryKey && column.primary)
		parts.push('PRIMARY KEY');
	if (column.notNull)
		parts.push('NOT NULL');
	return parts.join(' ');
}

function sqliteType(type) {
	if (type === 'number' || type === 'boolean')
		return 'INTEGER';
	if (type === 'binary')
		return 'BLOB';
	return 'TEXT';
}

async function ensureSchemaStateTable(db) {
	await db.query([
		`CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaStateTable)} (`,
		'"scope" TEXT PRIMARY KEY,',
		'"dialect" TEXT NOT NULL,',
		'"tables_json" TEXT NOT NULL,',
		'"schema_json" TEXT NOT NULL,',
		'"checksum" TEXT NOT NULL,',
		'"sql_text" TEXT NOT NULL,',
		'"updated_at_ms" INTEGER NOT NULL',
		');'
	].join(' '));
}

async function readSchemaState(db, scope) {
	const rows = await db.query(`SELECT "checksum" FROM ${quoteIdent(schemaStateTable)} WHERE "scope" = ${sqlStringLiteral(scope)} LIMIT 1`);
	const list = Array.isArray(rows) ? rows : rows && rows.rows || [];
	const row = list[0];
	if (!row)
		return null;
	return {
		checksum: row.checksum ?? row.CHECKSUM
	};
}

async function writeSchemaState(db, state) {
	await db.query([
		`INSERT INTO ${quoteIdent(schemaStateTable)} (`,
		'"scope", "dialect", "tables_json", "schema_json", "checksum", "sql_text", "updated_at_ms"',
		') VALUES (',
		[
			sqlStringLiteral(state.scope),
			sqlStringLiteral(state.dialect),
			sqlStringLiteral(JSON.stringify(state.tables)),
			sqlStringLiteral(stableStringify(state.schema)),
			sqlStringLiteral(state.checksum),
			sqlStringLiteral(state.sql),
			String(state.updatedAtMs)
		].join(', '),
		');'
	].join(' '));
}

function quoteIdent(value) {
	return `"${String(value).replace(/"/g, '""')}"`;
}

function sqlStringLiteral(value) {
	if (value === null || value === undefined)
		return 'NULL';
	return `'${String(value).replace(/'/g, '\'\'')}'`;
}

function stableStringify(value) {
	if (value === null || typeof value !== 'object')
		return JSON.stringify(value);
	if (Array.isArray(value))
		return `[${value.map(stableStringify).join(',')}]`;
	const keys = Object.keys(value).sort();
	return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function checksumString(value) {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

module.exports = {
	ensureSyncSchema,
	buildSyncSchema,
	schemaToSql,
	stableStringify,
	checksumString
};
