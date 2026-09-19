const log = require('../table/log');
const workerDefaults = require('../workerDefaults');
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
	if (typeof Worker !== 'undefined' && workerDefaults.createSqliteWorker)
		return workerDefaults.createSqliteWorker(options.sqliteModuleUrl || getDefaultSqliteModuleUrl());
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
