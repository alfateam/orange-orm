const log = require('../table/log');
const createInlineSqliteOPFSWorker = require('./inlineWorker');
const connectWorkerPort = require('./connectWorkerPort');
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
		connectPort,
		cloneDatabaseTo,
		suspendDatabase,
		checkout,
		close,
		getOpenInfo,
		release,
		reset,
		ready
	};

	function connectPort() {
		if (closed)
			throw new Error('sqliteOPFS worker client is closed.');
		return connectWorkerPort(worker);
	}

	function executeQuery(query, callback) {
		executeQueryCore(query, callback);
	}

	function executeCommand(query, callback) {
		executeCommandCore(query, callback);
	}

	function cloneDatabaseTo(targetConnectionString, targetOptions = {}) {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		if (typeof targetConnectionString !== 'string' || targetConnectionString.length === 0)
			return Promise.reject(new Error('sqliteOPFS clone target must be a database filename.'));
		return ensureOpen()
			.then(() => request('cloneDatabaseTo', {
				targetConnectionString,
				targetVfs: normalizeVfs(targetOptions.vfs || requestedVfs),
				targetOpfsSahPoolOptions: targetOptions.opfsSahPoolOptions
			}))
			.then(response => response.result);
	}

	function suspendDatabase() {
		if (closed || !openPromise)
			return Promise.resolve();
		return openPromise
			.then(() => request('suspendDatabase'))
			.finally(() => {
				openPromise = null;
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
				cloneDatabaseTo,
				suspendDatabase,
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
			cloneDatabaseTo(targetConnectionString, targetOptions = {}) {
				return request('cloneDatabaseTo', {
					targetConnectionString,
					targetVfs: normalizeVfs(targetOptions.vfs || requestedVfs),
					targetOpfsSahPoolOptions: targetOptions.opfsSahPoolOptions,
					leaseId
				}).then(response => response.result);
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
					...payload
				};
				worker.postMessage(message);
			}
			catch (e) {
				pending.delete(id);
				reject(e);
			}
		});
	}

	function ensureOpen() {
		if (closed)
			return Promise.reject(new Error('sqliteOPFS worker client closed.'));
		if (!openPromise) {
			openPromise = openWorkerDb(requestedVfs)
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
			opfsAccessTimeoutMs: options.opfsAccessTimeoutMs || 300000,
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
let db;
let dbOpenOptions;
let dbOpenInfo;
let dbVfsSuspender;
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
	if (message.method === 'open')
		return openDb(message.connectionString, message.busyTimeoutMs, message.vfs, message.opfsSahPoolOptions, message.opfsAccessTimeoutMs);
	if (message.method === 'close')
		return closeDb();
	if (message.method === 'suspendDatabase')
		return suspendDatabase();
	if (message.leaseId !== undefined && message.leaseId !== activeLeaseId)
		throw new Error('sqliteOPFS checkout is not active.');
	if (!db)
		await openDbFromLastOptions(message.connectionString);
	if (message.method === 'query')
		return query(message.sql, message.parameters);
	if (message.method === 'command')
		return command(message.sql, message.parameters);
	if (message.method === 'cloneDatabaseTo')
		return cloneDatabaseTo(
			message.targetConnectionString,
			message.targetVfs,
			message.targetOpfsSahPoolOptions
		);
	throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
}

async function openDb(connectionString, busyTimeoutMs = 5000, vfs, opfsSahPoolOptions, opfsAccessTimeoutMs) {
	if (db)
		return { opened: true, reused: true, ...(dbOpenInfo || {}) };
	dbOpenOptions = { connectionString, busyTimeoutMs, vfs, opfsSahPoolOptions, opfsAccessTimeoutMs };
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(connectionString);
	const dbInfo = await createDb(sqlite3, filename, vfs, opfsSahPoolOptions, opfsAccessTimeoutMs);
	db = dbInfo.db;
	dbVfsSuspender = dbInfo.suspend;
	db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
	dbOpenInfo = {
		opened: true,
		opfs: dbInfo.opfs === true,
		vfs: dbInfo.vfs,
		filename: db.filename
	};
	return dbOpenInfo;
}

function closeDb() {
	if (db && typeof db.close === 'function')
		db.close();
	db = null;
	return { closed: true };
}

async function suspendDatabase() {
	closeDb();
	const suspend = dbVfsSuspender;
	dbVfsSuspender = undefined;
	if (typeof suspend === 'function')
		await suspend();
	return { suspended: true };
}

function openDbFromLastOptions(connectionString) {
	const options = dbOpenOptions || { connectionString: connectionString || 'orange.sqlite3' };
	return openDb(options.connectionString, options.busyTimeoutMs, options.vfs, options.opfsSahPoolOptions, options.opfsAccessTimeoutMs);
}

async function createDb(sqlite3, filename, vfs, opfsSahPoolOptions, opfsAccessTimeoutMs) {
	if (!vfs || vfs === 'opfs-wl')
		return createOpfsWlDb(sqlite3, filename, opfsAccessTimeoutMs);
	if (vfs === 'opfs-sahpool')
		return createOpfsSahPoolDb(sqlite3, filename, opfsSahPoolOptions);
	throw new Error('sqliteOPFS vfs "' + vfs + '" is not supported. Use "opfs-wl" or "opfs-sahpool".');
}

async function createOpfsWlDb(sqlite3, filename, opfsAccessTimeoutMs) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
	const db = await openOpfsWlDb(DbClass, filename, opfsAccessTimeoutMs);
	return {
		db,
		vfs: 'opfs-wl',
		opfs: true,
		importDatabase: typeof DbClass.importDb === 'function'
			? (bytes) => DbClass.importDb(filename, bytes)
			: undefined
	};
}

async function openOpfsWlDb(DbClass, filename, timeoutMs) {
	const startedAt = Date.now();
	for (;;) {
		try {
			return new DbClass(filename);
		}
		catch (error) {
			if (!isOpfsAccessHandleBusyError(error)
				|| Date.now() - startedAt >= (Number.parseInt(timeoutMs, 10) || 300000))
				throw error;
			await new Promise(resolve => setTimeout(resolve, 25));
		}
	}
}

function isOpfsAccessHandleBusyError(error) {
	const message = error && error.message || '';
	return message.includes('createSyncAccessHandle')
		&& message.includes('another open Access Handle or Writable stream');
}

async function createOpfsSahPoolDb(sqlite3, filename, opfsSahPoolOptions) {
	if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
	if (pool && typeof pool.isPaused === 'function' && pool.isPaused()
		&& typeof pool.unpauseVfs === 'function')
		await pool.unpauseVfs();
	const DbClass = pool && pool.OpfsSAHPoolDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: pool.vfsName || 'opfs-sahpool',
		opfs: true,
		importDatabase: typeof pool.importDb === 'function'
			? (bytes) => pool.importDb(filename, bytes)
			: undefined,
		suspend: typeof pool.pauseVfs === 'function'
			? () => pool.pauseVfs()
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

async function cloneDatabaseTo(targetConnectionString, targetVfs, targetOpfsSahPoolOptions) {
	if (!db || !dbOpenOptions)
		throw new Error('sqliteOPFS source database is not open.');
	const sqlite3 = await getSqlite3();
	const capi = sqlite3 && sqlite3.capi;
	const supportsPageBackup = !!capi
		&& typeof capi.sqlite3_backup_init === 'function'
		&& typeof capi.sqlite3_backup_step === 'function'
		&& typeof capi.sqlite3_backup_finish === 'function';
	const targetFilename = normalizeFilename(targetConnectionString);
	if (targetFilename === db.filename)
		throw new Error('sqliteOPFS clone source and target must be different databases.');
	const targetInfo = await createDb(
		sqlite3,
		targetFilename,
		targetVfs || dbOpenOptions.vfs,
		targetOpfsSahPoolOptions
	);
	const targetDb = targetInfo.db;
	if (!supportsPageBackup) {
		if (!capi || typeof capi.sqlite3_js_db_export !== 'function'
			|| typeof targetInfo.importDatabase !== 'function') {
			targetDb.close();
			throw new Error('sqliteOPFS runtime cannot clone a SQLite database.');
		}
		targetDb.close();
		const bytes = capi.sqlite3_js_db_export(db.pointer);
		try {
			await targetInfo.importDatabase(bytes);
			return { cloned: true, strategy: 'export-import', byteLength: bytes.byteLength };
		}
		finally {
			if (typeof targetInfo.suspend === 'function')
				await targetInfo.suspend();
		}
	}
	let backup;
	let stepResult;
	try {
		backup = capi.sqlite3_backup_init(targetDb.pointer, 'main', db.pointer, 'main');
		if (!backup)
			throw new Error('sqliteOPFS could not initialize the SQLite backup.');
		stepResult = capi.sqlite3_backup_step(backup, -1);
		if (stepResult !== capi.SQLITE_DONE)
			throw new Error('sqliteOPFS SQLite backup failed with result ' + stepResult + '.');
	}
	finally {
		if (backup)
			capi.sqlite3_backup_finish(backup);
		if (targetDb && typeof targetDb.close === 'function')
			targetDb.close();
		if (typeof targetInfo.suspend === 'function')
			await targetInfo.suspend();
	}
	return {
		cloned: true,
		pageCount: Number(db.selectValue('PRAGMA page_count')) || 0,
		pageSize: Number(db.selectValue('PRAGMA page_size')) || 0
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
