const log = require('../table/log');
const createInlineSqliteOPFSWorker = require('./inlineWorker');
const normalizeOpfsSahPoolOptions = require('./normalizeOpfsSahPoolOptions');

function createSqliteOPFSWorkerClient(connectionString, options = {}) {
	const requestedVfs = normalizeVfs(options.vfs);
	const worker = options.worker || createWorker(connectionString, options);
	let nextId = 1;
	const pending = new Map();
	const readonly = !!options.readonly;
	const lane = readonly ? 'reader' : 'writer';
	let closed = false;
	let openPromise;
	let openInfo;

	worker.addEventListener('message', onMessage);
	worker.addEventListener('error', onWorkerError);
	worker.addEventListener('messageerror', onWorkerError);
	startMessagePort(worker);

	const opfsSahPoolOptions = normalizeOpfsSahPoolOptions(options, connectionString);
	const ready = options.deferOpen ? null : ensureOpen();

	return {
		executeQuery,
		executeCommand,
		exportDatabase,
		replaceDatabase,
		checkout,
		close,
		getOpenInfo,
		release,
		reset,
		ready
	};

	function executeQuery(query, callback) {
		executeQueryCore(query, callback);
	}

	function executeCommand(query, callback) {
		executeCommandCore(query, callback);
	}

	function exportDatabase() {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		return ensureOpen()
			.then(() => request('exportDatabase'))
			.then(response => response.result);
	}

	function replaceDatabase(bytes) {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		if (!(bytes instanceof Uint8Array))
			return Promise.reject(new Error('sqliteOPFS replacement requires SQLite file bytes.'));
		return ensureOpen()
			.then(() => request('replaceDatabase', { bytes }))
			.then(response => {
				openInfo = normalizeOpenResult(response.result);
				openPromise = Promise.resolve(openInfo);
				return openInfo;
			});
	}

	function executeQueryCore(query, callback, leaseId) {
		if (closed)
			return callback(new Error('sqliteOPFS worker client closed.'));
		const sql = query.sql();
		const parameters = query.parameters || [];
		log.emitQuery({ sql, parameters, readonly, lane, connectionString });
		const startedAt = now();
		ensureOpen()
			.then(() => request('query', { sql, parameters, leaseId }))
			.then(({ result, workerElapsedMs }) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs, readonly, lane, connectionString });
				callback(null, result);
			})
			.catch((error) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error, readonly, lane, connectionString });
				callback(error);
			});
	}

	function executeCommandCore(query, callback, leaseId) {
		if (closed)
			return callback(new Error('sqliteOPFS worker client closed.'));
		const sql = query.sql();
		const parameters = query.parameters || [];
		log.emitQuery({ sql, parameters, readonly, lane, connectionString });
		const startedAt = now();
		ensureOpen()
			.then(() => request('command', { sql, parameters, leaseId }))
			.then(({ result, workerElapsedMs }) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs, readonly, lane, connectionString });
				callback(null, result);
			})
			.catch((error) => {
				log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error, readonly, lane, connectionString });
				callback(error);
			});
	}

	function checkout(priority) {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		return ensureOpen()
			.then(() => request('checkout', { priority }))
			.then(({ result }) => createLeasedClient(result && result.leaseId))
			.catch((error) => {
				if (isUnsupportedCheckoutError(error))
					return createLeasedClient();
				throw error;
			});
	}

	function createLeasedClient(leaseId) {
		if (leaseId === undefined || leaseId === null)
			return {
				executeQuery,
				executeCommand,
				exportDatabase,
				replaceDatabase,
				getOpenInfo,
				reset,
				releaseCheckout: () => Promise.resolve()
			};
		return {
			executeQuery(query, callback) {
				executeQueryCore(query, callback, leaseId);
			},
			executeCommand(query, callback) {
				executeCommandCore(query, callback, leaseId);
			},
			exportDatabase() {
				return request('exportDatabase', { leaseId }).then(response => response.result);
			},
			replaceDatabase(bytes) {
				if (!(bytes instanceof Uint8Array))
					return Promise.reject(new Error('sqliteOPFS replacement requires SQLite file bytes.'));
				return request('replaceDatabase', { bytes, leaseId }).then(response => {
					openInfo = normalizeOpenResult(response.result);
					openPromise = Promise.resolve(openInfo);
					return openInfo;
				});
			},
			getOpenInfo,
			reset,
			releaseCheckout() {
				return request('release', { leaseId }).then(() => undefined);
			}
		};
	}

	function request(method, payload = {}) {
		if (closed && method !== 'close')
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		const id = nextId++;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			try {
				const message = {
					type: 'orange-sqlite-opfs-request',
					id,
					method,
					connectionString,
					...payload
				};
				const transfer = databaseTransferList(method, message);
				worker.postMessage(message, transfer);
			}
			catch (e) {
				pending.delete(id);
				reject(e);
			}
		});
	}

	function databaseTransferList(method, message) {
		if (method !== 'replaceDatabase' || !(message.bytes instanceof Uint8Array))
			return undefined;
		if (!(message.bytes.buffer instanceof ArrayBuffer))
			return undefined;
		if (message.bytes.byteOffset !== 0 || message.bytes.byteLength !== message.bytes.buffer.byteLength)
			message.bytes = message.bytes.slice();
		return [message.bytes.buffer];
	}

	function ensureOpen() {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		if (!openPromise) {
			const vfs = openInfo && openInfo.vfs || requestedVfs;
			openPromise = openWorkerDb(vfs)
				.then((info) => {
					openInfo = info;
					return info;
				})
				.catch((error) => {
					openPromise = null;
					throw error;
				});
		}
		return openPromise;
	}

	async function openWorkerDb(vfs) {
		const response = await request('open', {
			connectionString,
			busyTimeoutMs: options.busyTimeoutMs || 5000,
			vfs,
			opfsSahPoolOptions: vfs === 'opfs-sahpool' ? opfsSahPoolOptions : undefined
		});
		return normalizeOpenResult(response.result);
	}

	function normalizeOpenResult(result) {
		return {
			...result,
			requestedVfs
		};
	}

	function getOpenInfo() {
		return openInfo;
	}

	function release() {
		if (closed || !openPromise)
			return Promise.resolve();
		return openPromise
			.then(() => request('close'))
			.finally(() => {
				openPromise = null;
			});
	}

	function close() {
		if (closed)
			return Promise.resolve();
		closed = true;
		const closeRequest = options.closeDbOnClose === false
			? Promise.resolve()
			: withTimeout(request('close'), 1000).catch(() => {});
		return closeRequest.finally(() => {
			worker.removeEventListener('message', onMessage);
			worker.removeEventListener('error', onWorkerError);
			worker.removeEventListener('messageerror', onWorkerError);
			rejectPending(new Error('sqliteOPFS worker client closed.'));
			if (typeof worker.terminate === 'function')
				worker.terminate();
			else if (typeof worker.close === 'function')
				worker.close();
		});
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

	function withTimeout(promise, timeoutMs) {
		let timeoutId;
		const timeout = new Promise((resolve) => {
			timeoutId = setTimeout(resolve, timeoutMs);
		});
		return Promise.race([promise, timeout])
			.finally(() => clearTimeout(timeoutId));
	}
}

function now() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now();
	return Date.now();
}

function startMessagePort(port) {
	if (port && typeof port.start === 'function') {
		try {
			port.start();
		}
		catch (_e) {
			// MessagePort.start() is best-effort; browsers ignore repeated starts.
		}
	}
}

function isUnsupportedCheckoutError(error) {
	const message = error && error.message || '';
	return message.includes('Unknown') && (
		message.includes('method "checkout"')
			|| message.includes('method \'checkout\'')
	);
}

function createWorker(connectionString, options) {
	if (typeof options.createWorker === 'function')
		return options.createWorker(connectionString, options);
	if (typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmCreateSqliteOPFSWorker === 'function')
		return globalThis.__orangeOrmCreateSqliteOPFSWorker(connectionString, options);
	if (options.inlineWorker)
		return createInlineSqliteOPFSWorker({ ...options, connectionString });
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

createSqliteOPFSWorkerClient.createWorker = createWorker;
createSqliteOPFSWorkerClient.createWorkerSource = createWorkerSource;

function getDefaultSqliteModuleUrl() {
	return typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmSqliteOPFSModuleUrl === 'string'
		? globalThis.__orangeOrmSqliteOPFSModuleUrl
		: null;
}

function normalizeVfs(value) {
	const vfs = value || 'opfs-wl';
	if (vfs !== 'opfs-wl' && vfs !== 'opfs-sahpool')
		throw new Error(`sqliteOPFS vfs "${vfs}" is not supported. Use "opfs-wl" or "opfs-sahpool".`);
	return vfs;
}

function createWorkerSource(sqliteModuleUrl) {
	const sqliteInitConfig = {};
	return `
const sqliteModuleUrl = ${JSON.stringify(sqliteModuleUrl)};
const sqliteInitConfig = ${JSON.stringify(sqliteInitConfig)};
let sqlite3Promise;
const dbByConnectionString = new Map();
const dbOpenOptionsByConnectionString = new Map();
const dbOpenInfoByConnectionString = new Map();
const dbFileImporterByConnectionString = new Map();
let operationQueue = Promise.resolve();
let activeLeaseId;
let nextLeaseId = 1;
const checkoutQueue = [];
let nextCheckoutSeq = 1;

self.onmessage = (event) => {
	handleIncoming(event, self);
};

function handleIncoming(event, target) {
	const message = event && event.data;
	if (!message)
		return;
	if (message.type === 'orange-sqlite-opfs-connect') {
		const port = event.ports && event.ports[0] || message.port;
		if (port)
			attachPort(port);
		return;
	}
	if (message.type !== 'orange-sqlite-opfs-request')
		return;
	handleRequest(message, target || self);
}

function attachPort(port) {
	port.addEventListener('message', (event) => handleIncoming(event, port));
	if (typeof port.start === 'function')
		port.start();
}

function handleRequest(message, target) {
	if (message.method === 'checkout')
		return handleCheckout(message, target);
	if (message.method === 'release')
		return handleRelease(message, target);
	operationQueue = operationQueue
		.then(() => dispatchTimed(message))
		.then(({ result, elapsedMs }) => postResponse(target, message.id, result, undefined, elapsedMs))
		.catch((error) => postResponse(target, message.id, undefined, error));
}

function handleCheckout(message, target) {
	checkoutQueue.push({
		message,
		target,
		priority: normalizePriority(message.priority),
		seq: nextCheckoutSeq++
	});
	grantNextCheckout();
}

function handleRelease(message, target) {
	operationQueue = operationQueue
		.then(() => {
			if (message.leaseId !== activeLeaseId)
				throw new Error('Cannot release inactive sqliteOPFS checkout.');
			activeLeaseId = undefined;
			return { released: true };
		})
		.then((result) => {
			postResponse(target, message.id, result, undefined, 0);
			grantNextCheckout();
		})
		.catch((error) => postResponse(target, message.id, undefined, error));
}

function grantNextCheckout() {
	if (activeLeaseId !== undefined)
		return;
	const entry = shiftNextCheckout();
	if (!entry)
		return;
	const leaseId = nextLeaseId++;
	activeLeaseId = leaseId;
	operationQueue = operationQueue
		.then(() => postResponse(entry.target, entry.message.id, { leaseId }, undefined, 0))
		.catch((error) => postResponse(entry.target, entry.message.id, undefined, error));
}

function shiftNextCheckout() {
	if (checkoutQueue.length <= 1)
		return checkoutQueue.shift();
	let bestIndex = 0;
	for (let i = 1; i < checkoutQueue.length; i++) {
		const current = checkoutQueue[i];
		const best = checkoutQueue[bestIndex];
		if (current.priority < best.priority || current.priority === best.priority && current.seq < best.seq)
			bestIndex = i;
	}
	return checkoutQueue.splice(bestIndex, 1)[0];
}

async function dispatchTimed(message) {
	const startedAt = now();
	const result = await dispatch(message);
	return {
		result,
		elapsedMs: now() - startedAt
	};
}

async function dispatch(message) {
	const connectionString = normalizeConnectionString(message.connectionString);
	if (message.method === 'open')
		return openDb(connectionString, message.busyTimeoutMs, message.vfs, message.opfsSahPoolOptions);
	if (message.method === 'close')
		return closeDb(connectionString);
	if (message.leaseId !== undefined && message.leaseId !== activeLeaseId)
		throw new Error('sqliteOPFS checkout is not active.');
	if (!dbByConnectionString.has(connectionString))
		await openDbFromLastOptions(connectionString);
	const db = dbByConnectionString.get(connectionString);
	if (message.method === 'query')
		return query(db, message.sql, message.parameters);
	if (message.method === 'command')
		return command(db, message.sql, message.parameters);
	if (message.method === 'exportDatabase')
		return exportDatabase(db);
	if (message.method === 'replaceDatabase')
		return replaceDatabase(connectionString, message.bytes);
	throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
}

async function openDb(connectionString, busyTimeoutMs = 5000, vfs, opfsSahPoolOptions) {
	const key = normalizeConnectionString(connectionString);
	if (dbByConnectionString.has(key))
		return { opened: true, reused: true, ...(dbOpenInfoByConnectionString.get(key) || {}) };
	dbOpenOptionsByConnectionString.set(key, { connectionString: key, busyTimeoutMs, vfs, opfsSahPoolOptions });
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(key);
	const dbInfo = await createDb(sqlite3, filename, vfs, opfsSahPoolOptions);
	const db = dbInfo.db;
	db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
	const dbOpenInfo = {
		opened: true,
		opfs: dbInfo.opfs === true,
		vfs: dbInfo.vfs,
		filename: db.filename
	};
	dbByConnectionString.set(key, db);
	dbOpenInfoByConnectionString.set(key, dbOpenInfo);
	dbFileImporterByConnectionString.set(key, dbInfo.importDatabase);
	return dbOpenInfo;
}

function closeDb(connectionString) {
	const key = normalizeConnectionString(connectionString);
	const db = dbByConnectionString.get(key);
	if (db && typeof db.close === 'function')
		db.close();
	dbByConnectionString.delete(key);
	return { closed: true };
}

function openDbFromLastOptions(connectionString) {
	const key = normalizeConnectionString(connectionString);
	const options = dbOpenOptionsByConnectionString.get(key) || { connectionString: key };
	return openDb(options.connectionString, options.busyTimeoutMs, options.vfs, options.opfsSahPoolOptions);
}

async function createDb(sqlite3, filename, vfs, opfsSahPoolOptions) {
	if (!vfs || vfs === 'opfs-wl')
		return createOpfsWlDb(sqlite3, filename);
	if (vfs === 'opfs-sahpool')
		return createOpfsSahPoolDb(sqlite3, filename, opfsSahPoolOptions);
	throw new Error('sqliteOPFS vfs "' + vfs + '" is not supported. Use "opfs-wl" or "opfs-sahpool".');
}

function createOpfsWlDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs-wl',
		opfs: true,
		importDatabase: typeof DbClass.importDb === 'function'
			? (bytes) => DbClass.importDb(filename, bytes)
			: undefined
	};
}

async function createOpfsSahPoolDb(sqlite3, filename, opfsSahPoolOptions) {
	if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
	const DbClass = pool && pool.OpfsSAHPoolDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: pool.vfsName || 'opfs-sahpool',
		opfs: true,
		importDatabase: typeof pool.importDb === 'function'
			? (bytes) => pool.importDb(filename, bytes)
			: undefined
	};
}

async function getSqlite3() {
	if (!sqlite3Promise) {
		sqlite3Promise = import(sqliteModuleUrl).then((module) => {
			const sqlite3InitModule = module && module.default || module;
			if (typeof sqlite3InitModule !== 'function')
				throw new Error('sqliteOPFS could not load sqlite-wasm module from ' + sqliteModuleUrl + '.');
			return sqlite3InitModule(sqliteInitConfig);
		});
	}
	return sqlite3Promise;
}

function query(db, sql, parameters = []) {
	return db.exec({
		sql,
		bind: normalizeParameters(parameters),
		rowMode: 'object',
		returnValue: 'resultRows'
	});
}

function command(db, sql, parameters = []) {
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

async function exportDatabase(db) {
	const sqlite3 = await getSqlite3();
	if (!db || db.pointer === undefined || !sqlite3.capi
		|| typeof sqlite3.capi.sqlite3_js_db_export !== 'function')
		throw new Error('sqliteOPFS runtime cannot export a SQLite database file.');
	return sqlite3.capi.sqlite3_js_db_export(db.pointer);
}

async function replaceDatabase(connectionString, bytes) {
	if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
	const key = normalizeConnectionString(connectionString);
	const importDatabase = dbFileImporterByConnectionString.get(key);
	if (typeof importDatabase !== 'function')
		throw new Error('sqliteOPFS runtime cannot replace a SQLite database file.');
	const options = dbOpenOptionsByConnectionString.get(key);
	if (!options)
		throw new Error('sqliteOPFS database open options are unavailable.');
	closeDb(key);
	await importDatabase(bytes);
	const info = await openDb(options.connectionString, options.busyTimeoutMs, options.vfs, options.opfsSahPoolOptions);
	const db = dbByConnectionString.get(key);
	const integrity = query(db, 'PRAGMA quick_check');
	const value = integrity[0] && (integrity[0].quick_check ?? integrity[0].QUICK_CHECK);
	if (value !== 'ok')
		throw new Error('Restored sqliteOPFS database failed PRAGMA quick_check.');
	return info;
}

function normalizeFilename(connectionString) {
	const value = normalizeConnectionString(connectionString);
	return value.startsWith('/') ? value : '/' + value;
}

function normalizeConnectionString(connectionString) {
	return String(connectionString || 'orange.sqlite3');
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

function normalizePriority(priority) {
	if (priority === undefined || priority === null)
		return 0;
	const parsed = Number.parseInt(priority, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function postResponse(target, id, result, error, elapsedMs) {
	const message = {
		type: 'orange-sqlite-opfs-response',
		id,
		result,
		elapsedMs,
		error: error ? serializeError(error) : undefined
	};
	const transfer = result instanceof Uint8Array && result.buffer instanceof ArrayBuffer
		? [result.buffer]
		: undefined;
	target.postMessage(message, transfer);
}

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

//# sourceURL=orange-orm-sqlite-opfs-worker.mjs
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
	if (event && event.error instanceof Error)
		return event.error;
	const message = event && event.message
		? event.message
		: 'sqliteOPFS worker failed before responding.';
	const e = new Error(message);
	if (event && event.filename)
		e.stack = `${message}\n${event.filename}:${event.lineno || 0}:${event.colno || 0}`;
	return e;
}

module.exports = createSqliteOPFSWorkerClient;
