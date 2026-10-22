const normalizeSahPool = require('./normalizeOpfsSahPoolOptions');
const { appendRoleSuffix, toSecondaryDataPoolOptions, toCachePoolOptions } = require('./storageLayout');
const { runWithCrossTabLock, normalizeLockNamePart } = require('../sync/crossTabLock');

// Call only after all clients using these files have completed db.close().
// This also works after a restart, without reopening a deleted account's data.
async function deleteSqliteOPFS(connectionString, options = {}) {
	if (typeof connectionString !== 'string' || !connectionString.trim())
		throw new Error('deleteSqliteOPFS requires a database name.');
	if (options.vfs !== 'opfs-sahpool' && options.vfs !== 'opfs-wl')
		throw new Error('deleteSqliteOPFS requires the original vfs.');
	const storage = globalThis.navigator && globalThis.navigator.storage;
	if (!storage || typeof storage.getDirectory !== 'function')
		throw new Error('OPFS storage is unavailable.');
	const databases = [{ name: connectionString, options }];
	if (options.sync) {
		const secondary = appendRoleSuffix(connectionString, 'b');
		const delta = appendRoleSuffix(connectionString, 'delta');
		databases.push({ name: secondary, options: toSecondaryDataPoolOptions(options, secondary) },
			{ name: delta, options: toCachePoolOptions(options, delta) });
	}
	const paths = databases.flatMap(database => {
		if (options.vfs === 'opfs-sahpool') {
			const pool = normalizeSahPool(database.options, database.name);
			return [{ path: pool.directory || '.' + (pool.name || 'opfs-sahpool'), recursive: true }];
		}
		return ['', '-journal', '-wal', '-shm'].map(suffix => ({ path: database.name + suffix, recursive: false }));
	}).map(entry => ({ ...entry, parts: safePath(entry.path) }));
	const identity = normalizeLockNamePart(connectionString);
	const lockNames = options.sync
		? ['dual-sync', 'dual-write', 'dual-read'].map(kind => `orange-orm:sqliteOPFS:${kind}:${identity}`)
		: [];
	if (options.vfs === 'opfs-wl')
		for (const database of databases)
			lockNames.push(`orange-orm:sqlite-opfs-access:${normalizeLockNamePart(database.name)}:opfs-wl`);
	async function locked(index) {
		if (index < lockNames.length)
			return runWithCrossTabLock(lockNames[index], { enabled: true, timeoutMs: 15000 }, () => locked(index + 1));
		const root = await storage.getDirectory();
		for (const entry of paths) {
			try {
				let directory = root;
				for (const part of entry.parts.slice(0, -1))
					directory = await directory.getDirectoryHandle(part);
				await directory.removeEntry(entry.parts[entry.parts.length - 1], { recursive: entry.recursive });
			}
			catch (error) {
				if (!error || error.name !== 'NotFoundError') throw error;
			}
		}
	}
	await locked(0);
}

function safePath(path) {
	const parts = String(path || '').replace(/^\/+/, '').split('/');
	if (parts.some(part => !part || part === '.' || part === '..') || String(path).includes('\\'))
		throw new Error('Refusing to delete an invalid OPFS database path.');
	return parts;
}

module.exports = deleteSqliteOPFS;
