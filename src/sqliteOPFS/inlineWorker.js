function createInlineSqliteOPFSWorker(options = {}) {
	const listeners = new Map();
	const sqliteModuleUrl = options.sqliteModuleUrl || getDefaultSqliteModuleUrl() || '@sqlite.org/sqlite-wasm';
	const sqliteInitConfig = {};
	const opfsSahPoolOptions = normalizeOpfsSahPoolOptions(options);
	let sqlite3Promise;
	let db;
	let queue = Promise.resolve();
	let closed = false;

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

	function postMessage(message) {
		if (closed || !message || message.type !== 'orange-sqlite-opfs-request')
			return;
		queue = queue
			.then(() => dispatchTimed(message))
			.then(({ result, elapsedMs }) => postResponse(message.id, result, undefined, elapsedMs))
			.catch((error) => postResponse(message.id, undefined, error));
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
			return openDb(message.connectionString, message.busyTimeoutMs, message.vfs);
		if (message.method === 'close')
			return closeDb();
		if (!db)
			await openDb(message.connectionString || 'orange.sqlite3');
		if (message.method === 'query')
			return query(message.sql, message.parameters);
		if (message.method === 'command')
			return command(message.sql, message.parameters);
		throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
	}

	async function openDb(connectionString, busyTimeoutMs = 5000, vfs) {
		if (db)
			return { opened: true, reused: true };
		const sqlite3 = await getSqlite3();
		const filename = normalizeFilename(connectionString);
		const dbInfo = await createDb(sqlite3, filename, vfs);
		db = dbInfo.db;
		db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
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
		if (vfs === 'opfs-wl')
			return createOpfsWlDb(sqlite3, filename);
		if (vfs === 'opfs-sahpool')
			return createOpfsSahPoolDb(sqlite3, filename);
		if (vfs && vfs !== 'opfs')
			throw new Error('sqliteOPFS vfs "' + vfs + '" is not supported.');
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

	function postResponse(id, result, error, elapsedMs) {
		emit('message', {
			data: {
				type: 'orange-sqlite-opfs-response',
				id,
				result,
				elapsedMs,
				error: error ? serializeError(error) : undefined
			}
		});
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

function normalizeOpfsSahPoolOptions(options = {}) {
	const source = options.opfsSahPool || options.opfsSAHPool || options.sahPool;
	if (!source || source !== Object(source))
		return {};
	return { ...source };
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

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

module.exports = createInlineSqliteOPFSWorker;
