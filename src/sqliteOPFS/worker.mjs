import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

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
		.then(() => dispatch(message))
		.then((result) => postResponse(target, message.id, result))
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
			postResponse(target, message.id, result);
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
		.then(() => postResponse(entry.target, entry.message.id, { leaseId }))
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
	throw new Error(`Unknown sqliteOPFS worker method "${message.method}".`);
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
	db.exec(`PRAGMA busy_timeout=${Number.parseInt(busyTimeoutMs, 10) || 5000}`);
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
	throw new Error(`sqliteOPFS vfs "${vfs}" is not supported. Use "opfs-wl" or "opfs-sahpool".`);
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

function normalizePriority(priority) {
	if (priority === undefined || priority === null)
		return 0;
	const parsed = Number.parseInt(priority, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function postResponse(target, id, result, error) {
	const message = {
		type: 'orange-sqlite-opfs-response',
		id,
		result,
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
