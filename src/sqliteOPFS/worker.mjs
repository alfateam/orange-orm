import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let sqlite3Promise;
const dbByConnectionString = new Map();
const dbOpenOptionsByConnectionString = new Map();
const dbOpenInfoByConnectionString = new Map();
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
	throw new Error(`Unknown sqliteOPFS worker method "${message.method}".`);
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
	db.exec(`PRAGMA busy_timeout=${Number.parseInt(busyTimeoutMs, 10) || 5000}`);
	const dbOpenInfo = {
		opened: true,
		opfs: dbInfo.opfs === true,
		vfs: dbInfo.vfs,
		filename: db.filename
	};
	dbByConnectionString.set(key, db);
	dbOpenInfoByConnectionString.set(key, dbOpenInfo);
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
	throw new Error(`sqliteOPFS vfs "${vfs}" is not supported. Use "opfs-wl" or "opfs-sahpool".`);
}

function createOpfsWlDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs-wl',
		opfs: true
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
		opfs: true
	};
}

async function getSqlite3() {
	if (!sqlite3Promise)
		sqlite3Promise = sqlite3InitModule();
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

function normalizeFilename(connectionString) {
	const value = normalizeConnectionString(connectionString);
	return value.startsWith('/') ? value : `/${value}`;
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

function normalizePriority(priority) {
	if (priority === undefined || priority === null)
		return 0;
	const parsed = Number.parseInt(priority, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function postResponse(target, id, result, error) {
	target.postMessage({
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
