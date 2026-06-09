const log = require('../table/log');

function createSqliteOPFSWorkerClient(connectionString, options = {}) {
	const worker = options.worker || createWorker(connectionString, options);
	let nextId = 1;
	const pending = new Map();

	worker.addEventListener('message', onMessage);
	worker.addEventListener('error', onWorkerError);
	worker.addEventListener('messageerror', onWorkerError);

	const ready = request('open', {
		connectionString,
		busyTimeoutMs: options.busyTimeoutMs || 5000,
		vfs: options.vfs,
		sahPool: options.sahPool
	});

	return {
		executeQuery,
		executeCommand,
		close,
		reset,
		ready
	};

	function executeQuery(query, callback) {
		const sql = query.sql();
		const parameters = query.parameters || [];
		log.emitQuery({ sql, parameters });
		const startedAt = now();
		ready
			.then(() => request('query', { sql, parameters }))
			.then(({ result, workerElapsedMs }) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs });
				callback(null, result);
			})
			.catch((error) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error });
				callback(error);
			});
	}

	function executeCommand(query, callback) {
		const sql = query.sql();
		const parameters = query.parameters || [];
		log.emitQuery({ sql, parameters });
		const startedAt = now();
		ready
			.then(() => request('command', { sql, parameters }))
			.then(({ result, workerElapsedMs }) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs });
				callback(null, result);
			})
			.catch((error) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error });
				callback(error);
			});
	}

	function request(method, payload = {}) {
		const id = nextId++;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			try {
				worker.postMessage({
					type: 'orange-sqlite-opfs-request',
					id,
					method,
					...payload
				});
			}
			catch (e) {
				pending.delete(id);
				reject(e);
			}
		});
	}

	function close() {
		worker.removeEventListener('message', onMessage);
		worker.removeEventListener('error', onWorkerError);
		worker.removeEventListener('messageerror', onWorkerError);
		rejectPending(new Error('sqliteOPFS worker client closed.'));
		if (typeof worker.terminate === 'function')
			worker.terminate();
	}

	function reset() {
		// The worker serializes all requests, so there is no pooled connection state to reset.
	}

	function onMessage(event) {
		const message = event && event.data;
		if (!message || message.type !== 'orange-sqlite-opfs-response')
			return;
		const entry = pending.get(message.id);
		if (!entry)
			return;
		pending.delete(message.id);
		if (message.error)
			entry.reject(toError(message.error));
		else
			entry.resolve({
				result: message.result,
				workerElapsedMs: message.elapsedMs
			});
	}

	function onWorkerError(event) {
		rejectPending(toWorkerError(event));
	}

	function rejectPending(error) {
		for (const entry of pending.values())
			entry.reject(error);
		pending.clear();
	}
}

function now() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now();
	return Date.now();
}

function createWorker(connectionString, options) {
	if (typeof options.createWorker === 'function')
		return options.createWorker(connectionString, options);
	if (typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmCreateSqliteOPFSWorker === 'function')
		return globalThis.__orangeOrmCreateSqliteOPFSWorker(connectionString, options);
	if (options.workerUrl && typeof Worker !== 'undefined')
		return new Worker(options.workerUrl, { type: 'module' });
	if (typeof Worker !== 'undefined') {
		try {
			const source = createWorkerSource(options.sqliteModuleUrl || getDefaultSqliteModuleUrl() || '@sqlite.org/sqlite-wasm');
			const blob = new Blob([source], { type: 'text/javascript' });
			const url = URL.createObjectURL(blob);
			return new Worker(url, { type: 'module' });
		}
		catch (e) {
			throw new Error(`sqliteOPFS could not create its worker automatically: ${e.message}`);
		}
	}
	throw new Error('sqliteOPFS requires Worker support or an explicit worker/createWorker option.');
}

function getDefaultSqliteModuleUrl() {
	return typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmSqliteOPFSModuleUrl === 'string'
		? globalThis.__orangeOrmSqliteOPFSModuleUrl
		: null;
}

function createWorkerSource(sqliteModuleUrl) {
	return `
import sqlite3InitModule from ${JSON.stringify(sqliteModuleUrl)};

let sqlite3Promise;
let db;
let queue = Promise.resolve();

self.onmessage = (event) => {
	const message = event && event.data;
	if (!message || message.type !== 'orange-sqlite-opfs-request')
		return;
	queue = queue
		.then(() => dispatchTimed(message))
		.then(({ result, elapsedMs }) => postResponse(message.id, result, undefined, elapsedMs))
		.catch((error) => postResponse(message.id, undefined, error));
};

async function dispatchTimed(message) {
	const startedAt = now();
	const result = await dispatch(message);
	return {
		result,
		elapsedMs: now() - startedAt
	};
}

async function dispatch(message) {
	if (message.method === 'open')
		return openDb(message.connectionString, message.busyTimeoutMs, message.vfs, message.sahPool);
	if (!db)
		await openDb(message.connectionString || 'orange.sqlite3');
	if (message.method === 'query')
		return query(message.sql, message.parameters);
	if (message.method === 'command')
		return command(message.sql, message.parameters);
	throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
}

async function openDb(connectionString, busyTimeoutMs = 5000, vfs, sahPoolOptions) {
	if (db)
		return { opened: true, reused: true };
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(connectionString);
	const dbInfo = await createDb(sqlite3, filename, vfs, sahPoolOptions);
	db = dbInfo.db;
	db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
	return {
		opened: true,
		opfs: dbInfo.vfs === 'opfs',
		vfs: dbInfo.vfs,
		filename: db.filename
	};
}

async function createDb(sqlite3, filename, vfs, sahPoolOptions) {
	if (vfs === 'opfs-sahpool') {
		if (typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
			throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
		const pool = await sqlite3.installOpfsSAHPoolVfs(sahPoolOptions || {});
		const DbClass = pool.OpfsSAHPoolDb;
		if (typeof DbClass !== 'function')
			throw new Error('sqliteOPFS vfs "opfs-sahpool" did not expose OpfsSAHPoolDb.');
		return {
			db: new DbClass(filename),
			vfs: pool.vfsName || 'opfs-sahpool'
		};
	}
	return {
		db: sqlite3.oo1.OpfsDb
		? new sqlite3.oo1.OpfsDb(filename)
		: new sqlite3.oo1.DB(filename, 'ct'),
		vfs: 'opfs'
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
	return value.startsWith('/') ? value : '/' + value;
}

function normalizeParameters(parameters) {
	return Array.isArray(parameters) ? parameters.map(normalizeParameter) : parameters;
}

function normalizeParameter(value) {
	if (value instanceof ArrayBuffer)
		return new Uint8Array(value);
	return value;
}

function now() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now();
	return Date.now();
}

function postResponse(id, result, error, elapsedMs) {
	self.postMessage({
		type: 'orange-sqlite-opfs-response',
		id,
		result,
		elapsedMs,
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
`;
}

function toError(error) {
	const e = new Error(error && error.message ? error.message : 'sqliteOPFS worker request failed.');
	if (error && error.name)
		e.name = error.name;
	if (error && error.stack)
		e.stack = error.stack;
	return e;
}

function toWorkerError(event) {
	if (event instanceof Error)
		return event;
	const message = event && event.message
		? event.message
		: 'sqliteOPFS worker failed before responding.';
	const e = new Error(message);
	if (event && event.filename)
		e.stack = `${message}\n${event.filename}:${event.lineno || 0}:${event.colno || 0}`;
	return e;
}

module.exports = createSqliteOPFSWorkerClient;
