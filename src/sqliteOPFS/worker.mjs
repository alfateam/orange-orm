import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let sqlite3Promise;
let db;
let queue = Promise.resolve();

self.onmessage = (event) => {
	const message = event && event.data;
	if (!message || message.type !== 'orange-sqlite-opfs-request')
		return;
	queue = queue
		.then(() => dispatch(message))
		.then((result) => postResponse(message.id, result))
		.catch((error) => postResponse(message.id, undefined, error));
};

async function dispatch(message) {
	if (message.method === 'open')
		return openDb(message.connectionString, message.busyTimeoutMs, message.vfs, message.sahPool);
	if (message.method === 'close')
		return closeDb();
	if (!db)
		await openDb(message.connectionString || 'orange.sqlite3');
	if (message.method === 'query')
		return query(message.sql, message.parameters);
	if (message.method === 'command')
		return command(message.sql, message.parameters);
	throw new Error(`Unknown sqliteOPFS worker method "${message.method}".`);
}

async function openDb(connectionString, busyTimeoutMs = 5000, vfs, sahPoolOptions) {
	if (db)
		return { opened: true, reused: true };
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(connectionString);
	const dbInfo = await createDb(sqlite3, filename, vfs, sahPoolOptions);
	db = dbInfo.db;
	db.exec(`PRAGMA busy_timeout=${Number.parseInt(busyTimeoutMs, 10) || 5000}`);
	return {
		opened: true,
		opfs: dbInfo.vfs === 'opfs' || dbInfo.vfs === 'opfs-wl',
		vfs: dbInfo.vfs,
		filename: db.filename
	};
}

function closeDb() {
	if (db && typeof db.close === 'function')
		db.close();
	db = null;
	return { closed: true };
}

async function createDb(sqlite3, filename, vfs, sahPoolOptions) {
	if (vfs === 'opfs-sahpool') {
		if (typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
			throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
		const resolvedSahPoolOptions = getSahPoolOptions(filename, sahPoolOptions);
		try {
			const pool = await sqlite3.installOpfsSAHPoolVfs(resolvedSahPoolOptions);
			const DbClass = pool.OpfsSAHPoolDb;
			if (typeof DbClass !== 'function')
				throw new Error('sqliteOPFS vfs "opfs-sahpool" did not expose OpfsSAHPoolDb.');
			return {
				db: new DbClass(filename),
				vfs: pool.vfsName || 'opfs-sahpool'
			};
		}
		catch (e) {
			if (resolvedSahPoolOptions.fallbackToOpfs)
				return createOpfsDb(sqlite3, filename);
			throw toSahPoolError(e, resolvedSahPoolOptions);
		}
	}
	if (vfs === 'opfs-wl')
		return createOpfsWlDb(sqlite3, filename);
	return createOpfsDb(sqlite3, filename);
}

function getSahPoolOptions(filename, options = {}) {
	let dbName = String(filename || 'orange.sqlite3');
	while (dbName.startsWith('/'))
		dbName = dbName.slice(1);
	if (!dbName)
		dbName = 'orange.sqlite3';
	const dotIndex = dbName.lastIndexOf('.');
	const slashIndex = dbName.lastIndexOf('/');
	const baseName = dotIndex > 0 && dotIndex > slashIndex
		? dbName.slice(0, dotIndex)
		: dbName;
	const safeName = toSafeName(baseName);
	return {
		name: `${safeName}-sahpool`,
		directory: `.${safeName}-sahpool`,
		...options
	};
}

function toSafeName(value) {
	let result = '';
	for (const ch of String(value || 'orange')) {
		const code = ch.charCodeAt(0);
		const ok = code >= 48 && code <= 57
			|| code >= 65 && code <= 90
			|| code >= 97 && code <= 122
			|| ch === '_'
			|| ch === '-';
		result += ok ? ch : '_';
	}
	return result || 'orange';
}

function createOpfsDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs'
	};
}

function createOpfsWlDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs-wl'
	};
}

function toSahPoolError(error, options = {}) {
	const message = error && error.message ? error.message : String(error);
	const isLockError = error && error.name === 'NoModificationAllowedError'
		|| /Access Handles cannot be created|NoModificationAllowedError|modifications are not allowed/i.test(message);
	if (!isLockError)
		return error;
	const directory = options && options.directory || '.opfs-sahpool';
	const name = options && options.name || 'opfs-sahpool';
	const e = new Error([
		'sqliteOPFS vfs "opfs-sahpool" is locked by another tab, worker, or app instance.',
		'Close other instances using this origin, restart the browser if a worker is stuck, or use a different sahPool.directory/name.',
		`Current sahPool.directory=${JSON.stringify(directory)}, sahPool.name=${JSON.stringify(name)}.`
	].join(' '));
	e.name = 'SqliteOPFSSAHPoolLockedError';
	e.cause = error;
	return e;
}

async function getSqlite3() {
	if (!sqlite3Promise)
		sqlite3Promise = sqlite3InitModule();
	return sqlite3Promise;
}

function query(sql, parameters = []) {
	return db.exec({
		sql,
		bind: normalizeParameters(parameters),
		rowMode: 'object',
		returnValue: 'resultRows'
	});
}

function command(sql, parameters = []) {
	const before = Number(db.changes(true) || 0);
	db.exec({
		sql,
		bind: normalizeParameters(parameters)
	});
	const after = Number(db.changes(true) || 0);
	return {
		rowsAffected: Math.max(0, after - before),
		lastInsertRowid: Number(db.selectValue('SELECT last_insert_rowid()'))
	};
}

function normalizeFilename(connectionString) {
	const value = String(connectionString || 'orange.sqlite3');
	return value.startsWith('/') ? value : `/${value}`;
}

function normalizeParameters(parameters) {
	return Array.isArray(parameters) ? parameters.map(normalizeParameter) : parameters;
}

function normalizeParameter(value) {
	if (value instanceof ArrayBuffer)
		return new Uint8Array(value);
	return value;
}

function postResponse(id, result, error) {
	self.postMessage({
		type: 'orange-sqlite-opfs-response',
		id,
		result,
		error: error ? serializeError(error) : undefined
	});
}

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}
