const schemaStateTable = 'orange_schema_state';
const schemaVersion = 1;
const ensuredSchemasByDb = new WeakMap();

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
	const ensuredKey = `${scope}:${checksum}`;
	if (isSchemaEnsured(db, ensuredKey))
		return { scope, schema, checksum, sql: sql.statements };

	await ensureSchemaStateTable(db);
	const existing = await readSchemaState(db, scope);
	const shouldUpdateState = !existing || existing.checksum !== checksum;
	if (existing && existing.checksum !== checksum && !isIndexOnlySchemaChange(existing.schemaJson, schema))
		throw new Error('Local sync schema does not match current map. Reset the local sync database or run a migration before syncing.');
	if (existing && existing.checksum === checksum) {
		markSchemaEnsured(db, ensuredKey);
		return { scope, schema, checksum, sql: sql.statements };
	}

	for (let i = 0; i < sql.statements.length; i++)
		await db.query(sql.statements[i]);

	if (shouldUpdateState)
		await writeSchemaState(db, {
			scope,
			dialect: 'sqlite',
			tables: schema.tables.map(x => x.name),
			schema,
			checksum,
			sql: sql.statements.join('\n'),
			updatedAtMs: Date.now()
		});

	markSchemaEnsured(db, ensuredKey);
	return { scope, schema, checksum, sql: sql.statements };
}

function isSchemaEnsured(db, key) {
	const ensured = ensuredSchemasByDb.get(db);
	return ensured ? ensured.has(key) : false;
}

function markSchemaEnsured(db, key) {
	let ensured = ensuredSchemasByDb.get(db);
	if (!ensured) {
		ensured = new Set();
		ensuredSchemasByDb.set(db, ensured);
	}
	ensured.add(key);
}

function clearEnsuredSyncSchema(db) {
	if (db)
		ensuredSchemasByDb.delete(db);
}

function buildSyncSchema(tables, tableNames) {
	const selected = Array.from(new Set(tableNames))
		.filter(name => tables[name])
		.sort();
	const schema = {
		version: schemaVersion,
		dialect: 'sqlite',
		tables: selected.map(name => tableToSchema(name, tables[name]))
	};
	addRelationIndexes(schema, tables, selected);
	return schema;
}

function tableToSchema(name, table) {
	const columns = (table._columns || []).map(columnToSchema);
	return {
		name,
		dbName: table._dbName,
		columns,
		indexes: [],
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
		statements: schema.tables.map(tableToCreateSql).concat(schema.tables.flatMap(tableToIndexSql))
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

function tableToIndexSql(table) {
	return (table.indexes || []).map(index => {
		return `CREATE INDEX IF NOT EXISTS ${quoteIdent(index.dbName)} ON ${quoteIdent(table.dbName)} (${index.columns.map(quoteIdent).join(', ')});`;
	});
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

function addRelationIndexes(schema, tables, selectedNames) {
	const tableSchemaByObject = new Map();
	const selectedObjects = new Set();
	for (let i = 0; i < selectedNames.length; i++) {
		const table = tables[selectedNames[i]];
		const tableSchema = schema.tables[i];
		tableSchemaByObject.set(table, tableSchema);
		selectedObjects.add(table);
	}

	const seen = new Set();
	for (let i = 0; i < selectedNames.length; i++) {
		const table = tables[selectedNames[i]];
		const relations = table && table._relations;
		if (!relations)
			continue;
		for (let relationName in relations) {
			const join = extractJoinRelation(relations[relationName]);
			if (!join || !selectedObjects.has(join.parentTable) || !selectedObjects.has(join.childTable))
				continue;
			const targetSchema = tableSchemaByObject.get(join.parentTable);
			const columns = (join.columns || []).map(x => x && x._dbName).filter(Boolean);
			if (!targetSchema || columns.length === 0 || isPrimaryKey(targetSchema, columns))
				continue;
			const key = `${targetSchema.dbName}:${columns.join('|')}`;
			if (seen.has(key))
				continue;
			seen.add(key);
			targetSchema.indexes.push({
				name: `relation:${relationName}`,
				dbName: newIndexName(targetSchema.dbName, columns),
				columns
			});
		}
	}

	for (let i = 0; i < schema.tables.length; i++)
		schema.tables[i].indexes.sort((a, b) => a.dbName.localeCompare(b.dbName));
}

function extractJoinRelation(relation) {
	if (!relation || typeof relation.accept !== 'function')
		return null;
	let join;
	relation.accept({
		visitJoin: function(current) {
			join = current;
		},
		visitOne: function(current) {
			join = current && current.joinRelation;
		},
		visitMany: function(current) {
			join = current && current.joinRelation;
		}
	});
	return join;
}

function isPrimaryKey(tableSchema, columns) {
	if (!Array.isArray(tableSchema.primaryKey) || tableSchema.primaryKey.length !== columns.length)
		return false;
	for (let i = 0; i < columns.length; i++) {
		if (tableSchema.primaryKey[i] !== columns[i])
			return false;
	}
	return true;
}

function newIndexName(tableName, columns) {
	const raw = `orange_idx_${tableName}_${columns.join('_')}`;
	return raw.replace(/[^A-Za-z0-9_]/g, '_');
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
	const rows = await db.query(`SELECT "checksum", "schema_json" FROM ${quoteIdent(schemaStateTable)} WHERE "scope" = ${sqlStringLiteral(scope)} LIMIT 1`);
	const list = Array.isArray(rows) ? rows : rows && rows.rows || [];
	const row = list[0];
	if (!row)
		return null;
	return {
		checksum: row.checksum ?? row.CHECKSUM,
		schemaJson: row.schema_json ?? row.SCHEMA_JSON
	};
}

async function writeSchemaState(db, state) {
	await db.query([
		`INSERT OR REPLACE INTO ${quoteIdent(schemaStateTable)} (`,
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

function isIndexOnlySchemaChange(existingSchemaJson, nextSchema) {
	if (typeof existingSchemaJson !== 'string')
		return false;
	try {
		const existing = JSON.parse(existingSchemaJson);
		return stableStringify(stripIndexes(existing)) === stableStringify(stripIndexes(nextSchema));
	}
	catch (_e) {
		return false;
	}
}

function stripIndexes(value) {
	if (Array.isArray(value))
		return value.map(stripIndexes);
	if (!value || typeof value !== 'object')
		return value;
	const result = {};
	for (let key in value) {
		if (key !== 'indexes')
			result[key] = stripIndexes(value[key]);
	}
	return result;
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
	clearEnsuredSyncSchema,
	buildSyncSchema,
	schemaToSql,
	stableStringify,
	checksumString
};
