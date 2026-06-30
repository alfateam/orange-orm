import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const opfsSahPoolOptions = {};
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
		return openDb(message.connectionString, message.busyTimeoutMs, message.vfs);
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

async function openDb(connectionString, busyTimeoutMs = 5000, vfs) {
	if (db)
		return { opened: true, reused: true };
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(connectionString);
	const dbInfo = await createDb(sqlite3, filename, vfs);
	db = dbInfo.db;
	db.exec(`PRAGMA busy_timeout=${Number.parseInt(busyTimeoutMs, 10) || 5000}`);
	return {
		opened: true,
		opfs: dbInfo.opfs === true,
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

async function createDb(sqlite3, filename, vfs) {
	if (!vfs || vfs === 'opfs')
		return createOpfsDb(sqlite3, filename);
	if (vfs === 'opfs-sahpool')
		return createOpfsSahPoolDb(sqlite3, filename);
	if (vfs && vfs !== 'opfs')
		throw new Error(`sqliteOPFS vfs "${vfs}" is not supported.`);
}

function createOpfsDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs',
		opfs: true
	};
}

async function createOpfsSahPoolDb(sqlite3, filename) {
	if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
	const DbClass = pool && pool.OpfsSAHPoolDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: pool.vfsName || 'opfs-sahpool',
		opfs: true
	};
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
