import { describe, expect, test } from 'vitest';

const newDualSyncDatabase = require('../src/sqliteOPFS/dualSyncDatabase');
const newDatabase = require('../src/sqliteOPFS/newDatabase');
const rdb = require('../src/client/index');
const count = require('../src/table/count');
const { ensureLocalSchemaReadySymbol } = require('../src/client/syncClient');

describe('sqliteOPFS dual sync database', () => {
	test('enables dual routing for sqliteOPFS sync by default', async () => {
		const db = newDatabase('app.sqlite3', {
			sync: { url: '/rdb' }
		});

		expect(db.__orangeSyncIdentity).toBe('sqliteOPFS:app.sqlite3:dual');

		await db.end();
	});

	test('can disable dual routing for sqliteOPFS sync', async () => {
		const db = newDatabase('app.sqlite3', {
			sync: { url: '/rdb', dualDataDb: false },
			createWorker() {
				return newIdleWorker();
			}
		});

		expect(db.__orangeSyncIdentity).toBe('sqliteOPFS:app.sqlite3');

		await db.end();
	});

	test('routes regular queries to the default active role', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb', dualDataDb: true }
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
			sync: { url: '/rdb', dualDataDb: true }
		}, fixture.createSingleDatabase);

		const rows = await db.query('SELECT 2');

		expect(rows).toEqual([{
			connectionString: 'app.__orange_sync_b.sqlite3',
			sql: 'SELECT 2'
		}]);
	});

	test('uses the cached manifest for repeated regular queries', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb', dualDataDb: true }
		}, fixture.createSingleDatabase);

		await db.query('SELECT first');
		await db.query('SELECT second');

		expect(fixture.cacheSql.filter(sql => /SELECT "active_role"/u.test(sql))).toHaveLength(1);
	});

	test('updates the cached manifest from an external sync event', async () => {
		const fixture = newFixture();
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb', dualDataDb: true }
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

	test('updates the cached manifest from an external reset result', async () => {
		const fixture = newFixture({
			activeRole: 'b',
			stagingRole: 'a',
			updatedAtMs: Date.now() + 60000
		});
		const db = newDualSyncDatabase('app.sqlite3', {
			sync: { url: '/rdb', dualDataDb: true }
		}, fixture.createSingleDatabase);
		const syncClient = newFakeSyncClient({
			async resetLocal() {
				return {
					reset: true,
					activeRole: 'a',
					stagingRole: 'b',
					updatedAtMs: Date.now()
				};
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
			sync: { url: '/rdb', dualDataDb: true }
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
			sync: { url: '/rdb', dualDataDb: true }
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
			sync: { url: '/rdb', dualDataDb: true }
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
			sync: { url: '/rdb', dualDataDb: true }
		}, fixture.createSingleDatabase);

		await db.query('SELECT 1');

		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.createWorker).toBe(createWorker);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_delta.sqlite3').options.closeDbOnClose).toBe(false);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.createWorker).toBe(createWorker);
		expect(fixture.created.find(x => x.connectionString === 'app.__orange_sync_b.sqlite3').options.closeDbOnClose).toBe(false);
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
			updated_at_ms: fixture.manifest.updatedAtMs
		}];
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
