const { buildSyncSchema, schemaToSql, stableStringify, checksumString } = require('../client/syncSchema');

const snapshotMimeType = 'application/vnd.sqlite3';

function createSqliteSnapshotStore(client, options, runReadonly) {
	if (options === true) options = { enabled: true };
	if (!options || options.enabled !== true) return null;
	const maxEntries = positiveInteger(options.maxEntries, 1);
	const rowsPerRead = positiveInteger(options.rowsPerRead, 1000);
	const entries = new Map();
	const builds = new Map();
	return { getOrBuild, get: id => entries.get(id) || null };

	async function getOrBuild(tableNames, watermark, request, response) {
		const schema = buildSyncSchema(client.tables, tableNames);
		const schemaJson = stableStringify(schema);
		const schemaChecksum = checksumString(schemaJson);
		const key = stableStringify({ tableNames, watermark, schemaChecksum });
		const cached = Array.from(entries.values()).find(entry => entry.key === key);
		if (cached) {
			cached.lastUsedAtMs = Date.now();
			return toDescriptor(cached, true);
		}
		if (!builds.has(key)) {
			builds.set(key, build(key, schema, schemaJson, schemaChecksum, watermark, request, response)
				.finally(() => builds.delete(key)));
		}
		return toDescriptor(await builds.get(key), false);
	}

	async function build(key, schema, schemaJson, schemaChecksum, watermark, request, response) {
		const crypto = loadNodeBuiltin('node:crypto');
		const fs = loadNodeBuiltin('node:fs');
		const os = loadNodeBuiltin('node:os');
		const path = loadNodeBuiltin('node:path');
		const { DatabaseSync } = loadNodeSqlite();
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-sync-snapshot-'));
		const filename = path.join(directory, 'snapshot.sqlite3');
		const startedAtMs = Date.now();
		let database;
		try {
			database = new DatabaseSync(filename);
			database.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA temp_store=MEMORY;');
			for (const statement of schemaToSql(schema).statements) database.exec(statement);
			database.exec('CREATE TABLE "orange_snapshot_meta" ("format" INTEGER NOT NULL, "schema_checksum" TEXT NOT NULL, "schema_json" TEXT NOT NULL, "watermark_json" TEXT, "row_count" INTEGER NOT NULL);');
			let rowCount = 0;
			await runReadonly(async tx => {
				database.exec('BEGIN');
				try {
					for (const tableSchema of schema.tables) {
						const table = tx[tableSchema.name];
						if (!table || typeof table.getMany !== 'function') continue;
						const quoted = tableSchema.columns.map(column => quoteIdent(column.dbName));
						const insert = database.prepare(`INSERT INTO ${quoteIdent(tableSchema.dbName)} (${quoted.join(',')}) VALUES (${quoted.map(() => '?').join(',')})`);
						let offset = 0;
						let rows;
						do {
							rows = await table.getMany(undefined, {
								orderBy: tableSchema.primaryKey,
								limit: rowsPerRead,
								offset
							});
							for (const row of rows) {
								insert.run(...tableSchema.columns.map(column => toSqliteValue(row[column.name], column.type)));
								rowCount += 1;
							}
							offset += rows.length;
						} while (rows.length === rowsPerRead);
					}
					database.prepare('INSERT INTO "orange_snapshot_meta" VALUES (?, ?, ?, ?, ?)').run(1, schemaChecksum, schemaJson, JSON.stringify(watermark), rowCount);
					database.exec('COMMIT');
				} catch (error) {
					database.exec('ROLLBACK');
					throw error;
				}
			}, request, response);
			database.close();
			database = null;
			const entry = { id: crypto.randomUUID(), key, bytes: fs.readFileSync(filename), schemaChecksum, watermark, rowCount, buildMs: Date.now() - startedAtMs, lastUsedAtMs: Date.now() };
			entries.set(entry.id, entry);
			while (entries.size > maxEntries) {
				const oldest = Array.from(entries.values()).sort((a, b) => a.lastUsedAtMs - b.lastUsedAtMs)[0];
				entries.delete(oldest.id);
			}
			return entry;
		} finally {
			if (database) database.close();
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}
}

function toDescriptor(entry, cacheHit) {
	return { id: entry.id, byteLength: entry.bytes.length, rowCount: entry.rowCount, schemaChecksum: entry.schemaChecksum, buildMs: entry.buildMs, cacheHit };
}

function loadNodeSqlite() {
	return loadNodeBuiltin('node:sqlite');
}

function loadNodeBuiltin(name) {
	const builtin = typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function'
		? process.getBuiltinModule(name)
		: null;
	if (builtin) return builtin;
	const error = new Error('SQLite snapshots require node:sqlite and process.getBuiltinModule() (Node.js 22.13 or newer).');
	error.code = 'ORANGE_SQLITE_SNAPSHOT_UNAVAILABLE';
	throw error;
}

function toSqliteValue(value, type) {
	if (value === null || value === undefined) return null;
	if (type === 'boolean') return value ? 1 : 0;
	if (type === 'json') return JSON.stringify(value);
	if (type === 'datetime' || type === 'datetime-tz') return value instanceof Date ? value.toISOString() : String(value);
	if (type === 'bigint') return String(value);
	if (type === 'binary') return Buffer.isBuffer(value) || value instanceof Uint8Array ? value : Buffer.from(String(value), 'base64');
	return value;
}

function positiveInteger(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function quoteIdent(value) { return `"${String(value).replace(/"/g, '""')}"`; }

module.exports = { createSqliteSnapshotStore, snapshotMimeType };
