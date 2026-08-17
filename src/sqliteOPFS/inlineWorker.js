function createInlineSqliteOPFSWorker(options = {}) {
	const listeners = new Map();
	const sqliteModuleUrl = options.sqliteModuleUrl || getDefaultSqliteModuleUrl() || '@sqlite.org/sqlite-wasm';
	const sqliteInitConfig = {};
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
	let closed = false;
	const rootTarget = {
		postMessage(message) {
			emit('message', { data: message });
		}
	};

	return {
		addEventListener,
		removeEventListener,
		postMessage,
		terminate
	};

	function addEventListener(type, listener) {
		const entries = listeners.get(type) || [];
		entries.push(listener);
		listeners.set(type, entries);
	}

	function removeEventListener(type, listener) {
		const entries = listeners.get(type) || [];
		listeners.set(type, entries.filter((entry) => entry !== listener));
	}

	function postMessage(message, transfer) {
		if (closed || !message || message.type !== 'orange-sqlite-opfs-request')
			return handleControlMessage(message, transfer);
		handleRequest(message, rootTarget);
	}

	function handleControlMessage(message, transfer) {
		if (closed || !message || message.type !== 'orange-sqlite-opfs-connect')
			return;
		const port = transfer && transfer[0] || message.port;
		if (port)
			attachPort(port);
	}

	function attachPort(port) {
		port.addEventListener('message', (event) => handleIncoming(event, port));
		if (typeof port.start === 'function')
			port.start();
	}

	function handleIncoming(event, target) {
		const message = event && event.data;
		if (!message || message.type !== 'orange-sqlite-opfs-request')
			return handleControlMessage(message);
		handleRequest(message, target);
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

	function terminate() {
		closed = true;
		listeners.clear();
		if (db && typeof db.close === 'function') {
			try {
				db.close();
			}
			catch (_e) {
				// Nothing useful to do during worker shutdown.
			}
		}
		db = null;
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
			return openDb(message.connectionString, message.busyTimeoutMs, message.vfs, message.opfsSahPoolOptions);
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

	async function openDb(connectionString, busyTimeoutMs = 5000, vfs, opfsSahPoolOptions) {
		if (db)
			return { opened: true, reused: true, ...(dbOpenInfo || {}) };
		dbOpenOptions = { connectionString, busyTimeoutMs, vfs, opfsSahPoolOptions };
		const sqlite3 = await getSqlite3();
		const filename = normalizeFilename(connectionString);
		const dbInfo = await createDb(sqlite3, filename, vfs, opfsSahPoolOptions);
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
			sqlite3Promise = loadSqliteModule().then((sqlite3InitModule) => {
				if (typeof sqlite3InitModule !== 'function')
					throw new Error('sqliteOPFS could not load sqlite-wasm module from ' + sqliteModuleUrl + '.');
				return sqlite3InitModule(sqliteInitConfig);
			});
		}
		return sqlite3Promise;
	}

	function loadSqliteModule() {
		if (typeof options.sqlite3InitModule === 'function')
			return Promise.resolve(options.sqlite3InitModule);
		if (typeof options.loadSqlite3 === 'function')
			return Promise.resolve(options.loadSqlite3(sqliteInitConfig));
		return import(sqliteModuleUrl).then((module) => module && module.default || module);
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
				throw new Error(`sqliteOPFS SQLite backup failed with result ${stepResult}.`);
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

	function emit(type, event) {
		for (const listener of listeners.get(type) || [])
			listener(event);
	}
}

function getDefaultSqliteModuleUrl() {
	return typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmSqliteOPFSModuleUrl === 'string'
		? globalThis.__orangeOrmSqliteOPFSModuleUrl
		: null;
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

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

module.exports = createInlineSqliteOPFSWorker;
