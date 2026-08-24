import { describe, expect, test } from 'vitest';

const newDualSyncDatabase = require('../src/sqliteOPFS/dualSyncDatabase');
const newDatabase = require('../src/sqliteOPFS/newDatabase');
const rdb = require('../src/client/index');
const count = require('../src/table/count');
const { ensureLocalSchemaReadySymbol } = require('../src/client/syncClient');
const { runSyncSwap } = require('../src/sync/writeGate');

describe('sqliteOPFS dual sync database', () => {
	test('enables dual routing for sqliteOPFS sync by default', async () => {
		const db = newDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		});

		expect(db.__orangeSyncIdentity).toBe('sqliteOPFS:app.sqlite3:dual');

		await db.end();
	});

	test('routes regular queries to the default active role', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		const rows = await db.query('SELECT 1');

		expect(rows).toEqual([{ connectionString: 'app.sqlite3', sql: 'SELECT 1' }]);
		expect(fixture.manifest).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b'
		});
	});

	test('routes regular queries to the persisted active role after a reload', async () => {
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: 123
		});
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		const rows = await db.query('SELECT 2');

		expect(rows).toEqual([{
			connectionString: 'app.__orange_sync_b.sqlite3',
			sql: 'SELECT 2'
		}]);
	});

	test('waits for a cross-context swap and refreshes the active role before querying', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const fixture = newFixture({
				activeRole: 'a',
				stagingRole: 'b',
				updatedAtMs: 100,
				generation: 0,
				clientId: 'fixture-client'
			});
			const db = newDualSyncDatabase('app.sqlite3', {
				sync: { url: '/rdb' }
			}, fixture.createSingleDatabase);
			await db.query('SELECT before swap');
			const swapRelease = newDeferred();
			let swapStarted = false;
			const syncContextDb = {
				__sqliteSync: db.__sqliteSync,
				__orangeCrossTabWriteLock: db.__orangeCrossTabWriteLock,
				__orangeCrossTabReadLock: db.__orangeCrossTabReadLock
			};
			const swap = runSyncSwap(syncContextDb, async () => {
				swapStarted = true;
				await swapRelease.promise;
				fixture.manifest = {
					activeRole: 'b',
					stagingRole: 'a',
					updatedAtMs: 200,
					generation: 1,
					clientId: 'fixture-client'
				};
			});
			await waitUntil(() => swapStarted);
			let queryCompleted = false;
			const query = db.query('SELECT during swap').then((rows) => {
				queryCompleted = true;
				return rows;
			});
			await wait(0);

			expect(queryCompleted).toBe(false);
			swapRelease.resolve();
			await swap;
			expect(await query).toEqual([{
				connectionString: 'app.__orange_sync_b.sqlite3',
				sql: 'SELECT during swap'
			}]);
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
	});

	test('holds the cross-context read lock until a readonly transaction commits', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const fixture = newFixture({
				activeRole: 'a',
				stagingRole: 'b',
				updatedAtMs: 100,
				generation: 0,
				clientId: 'fixture-client'
			});
			const db = newDualSyncDatabase('app.sqlite3', {
				sync: { url: '/rdb' }
			}, fixture.createSingleDatabase);
			const transaction = db.createTransaction({ readonly: true });
			await transaction(async () => {});
			let swapStarted = false;
			const syncContextDb = {
				__sqliteSync: db.__sqliteSync,
				__orangeCrossTabWriteLock: db.__orangeCrossTabWriteLock,
				__orangeCrossTabReadLock: db.__orangeCrossTabReadLock
			};
			const swap = runSyncSwap(syncContextDb, async () => {
				swapStarted = true;
			});
			await wait(0);

			expect(swapStarted).toBe(false);
			await transaction.commit();
			await swap;
			expect(swapStarted).toBe(true);
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
	});

	test('refreshes the persisted manifest before repeated regular queries', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		await db.query('SELECT first');
		const readsAfterFirstQuery = fixture.cacheSql.filter(sql => /SELECT "active_role"/u.test(sql)).length;
		await db.query('SELECT second');

		expect(fixture.cacheSql.filter(sql => /SELECT "active_role"/u.test(sql)).length)
			.toBeGreaterThan(readsAfterFirstQuery);
	});

	test('uses the cross-tab-safe opfs-wl VFS for every dual database by default', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		await db.query('SELECT 1');

		expect(fixture.created.find(x => x.connectionString === 'app.sqlite3').options.vfs).toBe('opfs-wl');
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.vfs).toBe('opfs-wl');
	});

	test('updates the cached manifest from an external sync event', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient();

		db.__orangeDualSyncAttachSyncClient(syncClient);
		await db.query('SELECT first');
		syncClient.emit('sync', {
			result: {
				__orangeDualSync: {
					activeRole: 'b',
					stagingRole: 'a',
					updatedAtMs: Date.now() + 1
				}
			}
		});
		const rows = await db.query('SELECT second');

		expect(rows).toEqual([{
			connectionString: 'app.__orange_sync_b.sqlite3',
			sql: 'SELECT second'
		}]);
	});

	test('routes early GUI reads from manifest data in an external initial-ready event', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient();

		db.__orangeDualSyncAttachSyncClient(syncClient);
		await db.query('SELECT before data ready');
		syncClient.emit('initial-ready', {
			source: 'dual-swap',
			role: 'b',
			activeRole: 'b',
			stagingRole: 'a',
			replicaState: 'replica-pending',
			generation: 1,
			updatedAtMs: Date.now() + 1
		});

		expect(await db.query('SELECT after data ready')).toEqual([{
			connectionString: 'app.__orange_sync_b.sqlite3',
			sql: 'SELECT after data ready'
		}]);
	});

	test('updates the cached manifest from an external reset result', async () => {
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: Date.now() + 60000
		});
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient({
			async resetLocal() {
				const manifest = {
					reset: true,
					activeRole: 'a',
					stagingRole: 'b',
					updatedAtMs: Date.now()
				};
				fixture.manifest = manifest;
				return manifest;
			}
		});

		db.__orangeDualSyncAttachSyncClient(syncClient);
		await db.query('SELECT before reset');
		await syncClient.resetLocal();
		const rows = await db.query('SELECT after reset');

		expect(rows).toEqual([{
			connectionString: 'app.sqlite3',
			sql: 'SELECT after reset'
		}]);
	});

	test('revalidates local schema before querying after external reset', async () => {
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: 123
		});
		fixture.schemaReadyByConnection.set('app.sqlite3', false);
		fixture.schemaReadyByConnection.set('app.__orange_sync_b.sqlite3', true);
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient({
			async resetLocal() {
				fixture.manifest = {
					activeRole: 'a',
					stagingRole: 'b',
					updatedAtMs: Date.now() + 1
				};
				fixture.schemaReadyByConnection.set('app.sqlite3', false);
				return {
					reset: true,
					...fixture.manifest
				};
			}
		});
		syncClient[ensureLocalSchemaReadySymbol] = async function() {
			fixture.externalEnsureCalls.push('external');
			return { skipped: false };
		};

		db.__orangeDualSyncAttachSyncClient(syncClient, newFakeRootClient());
		await db.query('SELECT before reset');
		await syncClient.resetLocal();
		const rows = await db.query('SELECT after reset');

		expect(rows).toEqual([{
			connectionString: 'app.sqlite3',
			sql: 'SELECT after reset'
		}]);
		expect(fixture.schemaReadyByConnection.get('app.sqlite3')).toBe(true);
		expect(fixture.externalEnsureCalls).toEqual([]);
	});

	test('client table reads prefer local dual schema readiness over external sync worker readiness', async () => {
		const fixture = newFixture();
		fixture.schemaReadyByConnection.set('app.sqlite3', false);
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient();
		syncClient[ensureLocalSchemaReadySymbol] = async function() {
			throw new Error('external sync worker readiness should not be used for UI reads');
		};
		const client = rdb({
			db,
			syncClient,
			tables: newFakeTables()
		});

		const count = await client.project.count();

		expect(count).toBe(0);
		expect(fixture.schemaReadyByConnection.get('app.sqlite3')).toBe(true);
	});

	test('attaches an external sync client through a lazy mapped database provider', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient();
		const mapped = rdb.map(({ table }) => ({
			project: table('project').map(({ column }) => ({
				id: column('id').string().primary().notNull()
			}))
		}));
		mapped({
			db: () => db,
			syncClient
		});

		await db.query('SELECT first');
		syncClient.emit('sync', {
			result: {
				__orangeDualSync: {
					activeRole: 'b',
					stagingRole: 'a',
					updatedAtMs: Date.now() + 1
				}
			}
		});
		const rows = await db.query('SELECT second');

		expect(rows).toEqual([{
			connectionString: 'app.__orange_sync_b.sqlite3',
			sql: 'SELECT second'
		}]);
	});

	test('does not reuse a provided single sqlite worker for secondary data files', async () => {
		const worker = newIdleWorker();
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: 123
		});
		const db = newDualSyncDatabase('app.sqlite3', {
			worker,
			closeDbOnClose: false,
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		await db.query('SELECT 1');

		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.worker).toBeUndefined();
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.worker).toBeUndefined();
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.closeDbOnClose).toBeUndefined();
	});

	test('keeps a connection-aware worker factory for every dual database file', async () => {
		const createWorker = () => newIdleWorker();
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: 123
		});
		const db = newDualSyncDatabase('app.sqlite3', {
			createWorker,
			closeDbOnClose: false,
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		await db.query('SELECT 1');

		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.createWorker).toBe(createWorker);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.closeDbOnClose).toBe(false);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.createWorker).toBe(createWorker);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.closeDbOnClose).toBe(false);
	});

	test('isolates secondary and manifest SAH pools from the active database', async () => {
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: 123
		});
		const opfsSahPool = {
			name: 'demo-pool',
			directory: '.demo-pool',
			initialCapacity: 8
		};
		const db = newDualSyncDatabase('app.sqlite3', {
			vfs: 'opfs-sahpool',
			opfsSahPool,
			sync: { url: '/rdb' }
		}, fixture.createSingleDatabase);

		await db.query('SELECT 1');

		const manifestOptions = fixture.created.find(
			x => x.connectionString === 'app.__orange_sync_delta.sqlite3'
		).options;
		const secondaryOptions = fixture.created.find(
			x => x.connectionString === 'app.__orange_sync_b.sqlite3'
		).options;
		expect(manifestOptions.opfsSahPool).toMatchObject({
			initialCapacity: 8
		});
		expect(manifestOptions.vfs).toBe('opfs-sahpool');
		expect(secondaryOptions.opfsSahPool).toMatchObject({
			initialCapacity: 8
		});
		expect(manifestOptions.opfsSahPool.name).not.toBe(opfsSahPool.name);
		expect(manifestOptions.opfsSahPool.directory).not.toBe(opfsSahPool.directory);
		expect(secondaryOptions.opfsSahPool.name).not.toBe(opfsSahPool.name);
		expect(secondaryOptions.opfsSahPool.directory).not.toBe(opfsSahPool.directory);
		expect(secondaryOptions.opfsSahPool.name).not.toBe(manifestOptions.opfsSahPool.name);
		expect(secondaryOptions.opfsSahPool.directory).not.toBe(manifestOptions.opfsSahPool.directory);
		expect(opfsSahPool).toEqual({
			name: 'demo-pool',
			directory: '.demo-pool',
			initialCapacity: 8
		});
	});
});

function newFixture(initialManifest) {
	const dbs = new Map();
	const fixture = {
		manifest: initialManifest,
		cacheSql: [],
		created: [],
		externalEnsureCalls: [],
		schemaReadyByConnection: new Map(),
		createSingleDatabase
	};
	return fixture;

	function createSingleDatabase(connectionString, options) {
		fixture.created.push({ connectionString, options });
		const db = newFakeDb(connectionString, options, fixture);
		dbs.set(connectionString, db);
		return db;
	}
}

function newIdleWorker() {
	return {
		postMessage() {},
		addEventListener() {},
		removeEventListener() {},
		terminate() {}
	};
}

function newFakeSyncClient(methods = {}) {
	const listeners = new Map();
	return {
		...methods,
		on(event, listener) {
			listeners.set(event, listener);
			return () => listeners.delete(event);
		},
		emit(event, payload) {
			const listener = listeners.get(event);
			if (listener)
				listener(payload);
		}
	};
}

function newFakeRootClient() {
	return function rootClient() {
		return {
			tables: newFakeTables(),
			transaction: async (fn) => fn({
				query: async () => []
			})
		};
	};
}

function newFakeTables() {
	const idColumn = {
		alias: 'id',
		_dbName: 'id',
		tsType: 'StringColumn',
		isPrimary: true
	};
	const project = {
		_dbName: 'project',
		_columns: [idColumn],
		_primaryColumns: [idColumn],
		_formulaDiscriminators: [],
		_columnDiscriminators: []
	};
	project.count = function(context, ...rest) {
		return count(context, project, ...rest);
	};
	return {
		project
	};
}

function newFakeDb(connectionString, options, fixture) {
	const db = {
		__sqliteSync: options && options.sync,
		hostLocal: true,
		async query(sql) {
			const sqlText = String(sql || '');
			if (connectionString === 'app.__orange_sync_delta.sqlite3')
				return queryCache(sql, fixture);
			if (/^SELECT "checksum", "schema_json" FROM "orange_schema_state"/u.test(sqlText))
				return [];
			if (/^CREATE TABLE IF NOT EXISTS "project"/u.test(sqlText))
				fixture.schemaReadyByConnection.set(connectionString, true);
			if (/^SELECT/u.test(sqlText) && fixture.schemaReadyByConnection.get(connectionString) === false)
				throw new Error('SQLITE_ERROR: sqlite3 result code 1: no such table: project');
			if (/^select count\(\*\) "_count" from "project"/iu.test(sqlText))
				return [{ _count: '0' }];
			return [{ connectionString, sql }];
		},
		async transaction(_options, fn) {
			if (typeof _options === 'function')
				fn = _options;
			return fn({
				rdb: {
					cache: {},
					changes: [],
					quote: (name) => `"${name}"`,
					dbClient: {
						executeQuery(query, callback) {
							const sql = String(query && typeof query.sql === 'function'
								? query.sql()
								: query && (query.sql || query)
							);
							db.query(sql)
								.then(rows => callback(null, rows))
								.catch(callback);
						}
					}
				}
			});
		},
		createTransaction() {
			async function run(fn) {
				return fn(this);
			}
			run.commit = async () => {};
			run.rollback = async () => {};
			return run;
		},
		async sqliteFunction() {
			return undefined;
		},
		async end() {}
	};
	return db;
}

function queryCache(sql, fixture) {
	fixture.cacheSql.push(sql);
	if (/SELECT "active_role"/u.test(sql)) {
		if (!fixture.manifest)
			return [];
		return [{
			active_role: fixture.manifest.activeRole,
			staging_role: fixture.manifest.stagingRole,
			updated_at_ms: fixture.manifest.updatedAtMs,
			generation: fixture.manifest.generation,
			client_id: fixture.manifest.clientId
		}];
	}
	if (/SET "client_id"/u.test(sql) && fixture.manifest) {
		fixture.manifest.clientId = fixture.manifest.clientId || 'fixture-client';
		return [];
	}
	if (/INSERT INTO "orange_sync_dual_manifest"/u.test(sql)) {
		if (!fixture.manifest) {
			fixture.manifest = {
				activeRole: 'a',
				stagingRole: 'b',
				updatedAtMs: Date.now()
			};
		}
		return [];
	}
	return [];
}

function createFakeWebLocks() {
	const states = new Map();
	return {
		request(name, options, callback) {
			return new Promise((resolve, reject) => {
				const state = states.get(name) || { active: [], queue: [] };
				state.queue.push({
					callback,
					mode: options && options.mode === 'shared' ? 'shared' : 'exclusive',
					reject,
					resolve
				});
				states.set(name, state);
				drain(name);
			});
		}
	};

	function drain(name) {
		const state = states.get(name);
		if (!state || state.queue.length === 0)
			return;
		if (state.active.some(entry => entry.mode === 'exclusive'))
			return;
		const next = state.queue[0];
		if (next.mode === 'exclusive') {
			if (state.active.length === 0)
				start(name, state, state.queue.shift());
			return;
		}
		while (state.queue.length > 0 && state.queue[0].mode === 'shared')
			start(name, state, state.queue.shift());
	}

	function start(name, state, entry) {
		state.active.push(entry);
		Promise.resolve()
			.then(entry.callback)
			.then(entry.resolve, entry.reject)
			.finally(() => {
				state.active = state.active.filter(activeEntry => activeEntry !== entry);
				drain(name);
			});
	}
}

function restoreGlobalNavigator(descriptor) {
	if (descriptor)
		Object.defineProperty(globalThis, 'navigator', descriptor);
	else
		delete globalThis.navigator;
}

function newDeferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, reject, resolve };
}

async function wait(ms) {
	await new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntil(predicate) {
	for (let i = 0; i < 50; i++) {
		if (predicate())
			return;
		await wait(0);
	}
	throw new Error('Timed out waiting for test condition.');
}
