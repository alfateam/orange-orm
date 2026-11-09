const pools = require('../pools');
const newId = require('../newId');
const log = require('../table/log');

// One checkout owns the connection for the entire ORM transaction. No unrelated
// read or write can enter between BEGIN and COMMIT, including during an await.
const registries = new WeakMap();
function newPool(connectionString, options) {
	const plugin = options.capacitorSQLite;
	const database = databaseName(connectionString);
	let registry = registries.get(plugin);
	if (!registry) registries.set(plugin, registry = new Map());
	if (registry.has(database)) throw new Error(`Native SQLite database is already in use: ${database}`);
	const args = { database, readonly: false };
	const id = newId();
	let created = false, opened = false, ended = false, closing, tail = Promise.resolve();
	let filename, terminalError;
	const pool = { connect, end, __orangeAcquireDatabaseAccess: acquire,
		__orangeSuspendDatabase: suspend, __orangeCloneDatabaseTo: clone, clonePath,
		__orangeConnectNativeWorker: () => require('./workerBridge')(pool),
		__orangeFail: error => { terminalError ||= error; } };
	registry.set(database, pool);
	pools[id] = pool;
	return pool;

	function acquire() {
		if (ended) return Promise.reject(new Error('Native SQLite pool is closed.'));
		let release;
		const held = new Promise(resolve => { release = resolve; });
		const previous = tail;
		tail = previous.then(() => held);
		return previous.then(() => {
			if (terminalError) { release(); throw terminalError; }
			return release;
		});
	}

	async function open() {
		if (!created) {
			const config = { ...args, version: 1, encrypted: false, mode: 'no-encryption' };
			try { await plugin.createConnection(config); }
			catch (error) {
				// A WebView restart can lose this registry while the native plugin
				// retains its handles. This pool already reserved the name above;
				// another live pool in this host cannot enter this recovery path.
				// Close only this handle, rolling back abandoned work but retaining
				// committed data. Never reset the plugin's global connection list.
				if (error?.message !== `CreateConnection: Connection ${database} already exists`) throw error;
				await plugin.closeConnection(args);
				// One attempt only; cleanup/recreation failures must propagate.
				await plugin.createConnection(config);
			}
			created = true;
		}
		if (opened) return;
		try {
			await plugin.open(args);
			opened = true;
			const rows = normalizeRows((await plugin.query({ ...args, statement: 'PRAGMA journal_mode=WAL', values: [] })).values);
			if (String(rows[0] && Object.values(rows[0])[0]).toLowerCase() !== 'wal')
				throw new Error('Native SQLite could not enable WAL.');
			// FULL protects committed offline edits against power loss. Do not use OFF.
			await plugin.execute({ ...args, statements: 'PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;', transaction: false });
			const url = (await plugin.getUrl(args)).url;
			if (!url) throw new Error('Native SQLite did not return its database path.');
			filename = url.startsWith('file:') ? decodeURIComponent(new URL(url).pathname) : url;
		} catch (error) {
			if (opened) await suspend();
			throw error;
		}
	}

	async function suspend() {
		if (!opened) return;
		await plugin.close(args);
		opened = false;
	}

	function connect(callback) {
		acquire().then(async release => {
			try { await open(); }
			catch (error) { release(); callback(error); return; }
			let released = false;
			const done = () => { if (!released) { released = true; release(); } };
			const execute = (command, query, cb) => {
				const sql = query.sql(), parameters = query.parameters || [];
				const complete = log.startQuery({ sql, parameters });
				run(sql, parameters, command).then(rows => { complete(); cb(null, rows); }, error => { complete(error); cb(error); });
			};
			try { callback(null, { executeQuery: execute.bind(null, false), executeCommand: execute.bind(null, true) }, done); }
			catch (error) { done(); throw error; }
		}, error => callback(error));
	}

	async function run(sql, parameters = [], command = false) {
		const values = parameters.map(value => value instanceof Uint8Array ? Array.from(value) : value);
		// Native iOS includes column-order metadata alongside unordered row objects.
		const statement = sql.replace(/^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '');
		if (/^(?:SELECT|WITH|PRAGMA|EXPLAIN)\b/i.test(statement))
			return normalizeRows((await plugin.query({ ...args, statement: sql, values })).values);
		if (values.length || /^(?:INSERT|UPDATE|DELETE|REPLACE)\b/i.test(statement)) {
			const result = await plugin.run({ ...args, statement: sql, values, transaction: false, returnMode: /\bRETURNING\b/i.test(statement) ? 'all' : 'no' });
			if (command) return { rowsAffected: result.changes.changes, lastInsertRowid: result.changes.lastId };
			return normalizeRows(result.changes && result.changes.values);
		}
		await plugin.execute({ ...args, statements: sql, transaction: false });
		return [];
	}

	async function clone(targetConnectionString) {
		const target = registry.get(databaseName(targetConnectionString));
		if (!target || target === pool) throw new Error('Native SQLite clone requires a separate reserved target.');
		// The router reserves the target. Copy through SQLite so committed WAL pages,
		// blobs and large tables never cross the JSON bridge. Only the target is written;
		// its schema and data are replaced in one crash-atomic transaction.
		const release = await acquire();
		let attached = false, transaction = false, foreignKeys = 1;
		try {
			await open();
			foreignKeys = Number((await run('PRAGMA foreign_keys'))[0].foreign_keys);
			const schema = await run("SELECT type, name, sql FROM main.sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type, name");
			if (schema.some(row => /^CREATE\s+VIRTUAL\s/i.test(row.sql)))
				throw new Error('Native replica cloning does not support virtual tables.');
			const path = await target.clonePath();
			await run(`ATTACH DATABASE '${path.replace(/'/g, "''")}' AS orange_clone`);
			attached = true;
			await run('PRAGMA foreign_keys=OFF');
			await run('BEGIN IMMEDIATE');
			transaction = true;
			const old = await run("SELECT type, name FROM orange_clone.sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('view', 'trigger', 'table') ORDER BY CASE type WHEN 'view' THEN 0 WHEN 'trigger' THEN 1 ELSE 2 END");
			for (const row of old) await run(`DROP ${row.type.toUpperCase()} IF EXISTS orange_clone.${quote(row.name)}`);
			for (const row of schema.filter(row => row.type === 'table')) {
				await run(qualifySchema(row));
				const columns = await run(`PRAGMA main.table_xinfo(${quote(row.name)})`);
				const names = columns.filter(column => !column.hidden).map(column => quote(column.name)).join(',');
				await run(`INSERT INTO orange_clone.${quote(row.name)} (${names}) SELECT ${names} FROM main.${quote(row.name)}`);
			}
			if ((await run("SELECT name FROM main.sqlite_master WHERE name='sqlite_sequence'")).length) {
				await run('DELETE FROM orange_clone.sqlite_sequence');
				await run('INSERT INTO orange_clone.sqlite_sequence SELECT * FROM main.sqlite_sequence');
			}
			for (const row of schema.filter(row => row.type !== 'table')) await run(qualifySchema(row));
			await run('COMMIT');
			transaction = false;
		} finally {
			try {
				if (transaction) await run('ROLLBACK');
			} finally {
				try { if (attached) await run('DETACH DATABASE orange_clone'); }
				finally {
					try { if (opened) await run(`PRAGMA foreign_keys=${foreignKeys}`); }
					finally { release(); }
				}
			}
		}
	}

	async function clonePath() {
		await open();
		await suspend();
		return filename;
	}

	function end() {
		if (closing) return closing;
		ended = true;
		closing = tail.then(async () => {
			if (created) await plugin.closeConnection(args);
			registry.delete(database);
			delete pools[id];
		});
		return closing;
	}
}

function quote(value) { return '"' + value.replace(/"/g, '""') + '"'; }

function qualifySchema(row) {
	const header = /^(CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|VIEW|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?)(?:"(?:[^"]|"")*"|'(?:[^']|'')*'|`(?:[^`]|``)*`|\[[^\]]*\]|[^\s(]+)/i;
	if (!header.test(row.sql)) throw new Error(`Unsupported native SQLite schema: ${row.name}`);
	return row.sql.replace(header, (_match, prefix) => `${prefix}orange_clone.${quote(row.name)}`);
}

function databaseName(connectionString) {
	if (typeof connectionString !== 'string' || !/^capacitor:[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(connectionString))
		throw new Error('Native SQLite requires capacitor:<database-name> without directories.');
	// Keep the whole logical name (including .sqlite3); the plugin adds SQLite.db.
	// Reject .db because the plugin strips it and would alias two distinct names.
	const name = connectionString.slice('capacitor:'.length);
	if (name.endsWith('.db')) throw new Error('Use a native database name without the .db suffix.');
	return name;
}

function normalizeRows(rows) {
	const result = rows || [];
	if (result.length && Object.keys(result[0]).length === 1 && Array.isArray(result[0].ios_columns)) {
		// Swift dictionaries do not preserve SELECT order. Orange decodes columns
		// positionally, so rebuild every row using the plugin's ordered names.
		const columns = result[0].ios_columns;
		return result.slice(1).map(row => Object.fromEntries(columns.map(name => [name, row[name]])));
	}
	return result;
}

module.exports = newPool;
module.exports.databaseName = databaseName;

// Internal guard shared with deletion; not part of the public Orange API.
module.exports.assertDatabasesClosed = function(plugin, names) {
	const registry = registries.get(plugin);
	if (names.some(name => registry && registry.has(name)))
		throw new Error('Close all native SQLite clients before deleting their storage.');
};
