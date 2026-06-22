import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');

describe('sync client auto start', () => {
	test('starts when start is called and stays running', async () => {
		const client = newSyncClient({}, async () => ({
			__sqliteSync: {
				url: '/rdb',
				auto: { enabled: true, intervalMs: 0, push: false, pull: false }
			}
		}), {});

		expect(client.isRunning()).toBe(false);
		await client.start();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(client.isRunning()).toBe(true);
		client.stop();
		expect(client.isRunning()).toBe(false);
	});
	test('emits push and pull errors', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});
		await new Promise((resolve) => setTimeout(resolve, 0));
		client.stop();
		const events = [];
		client.on('error', (payload) => events.push(['error', payload.method, payload.error.message]));
		client.once('push-error', (payload) => events.push(['push-error', payload.method, payload.error.message]));
		client.on('pull-error', (payload) => events.push(['pull-error', payload.method, payload.error.message]));

		await expect(client.push({ mutations: [{ id: 'm1' }] })).rejects.toThrow();
		await expect(client.pull()).rejects.toThrow();

		expect(events.map((x) => x[0])).toEqual(['push-error', 'error', 'pull-error', 'error']);
		expect(events.map((x) => x[1])).toEqual(['push', 'push', 'pull', 'pull']);
	});

	test('emits push, pull and sync events on success', async () => {
		const events = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				customer: {
					patch: async () => ({ changed: [] })
				},
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => ({
					data: request.data.phase === 'keys'
						? { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
						: { phase: 'push', applied: 0, duplicates: 0, results: [] }
				});
			}
		});
		client.on('push', (payload) => events.push(['push', payload.method]));
		client.on('pull', (payload) => events.push(['pull', payload.method]));
		client.on('sync', (payload) => events.push(['sync', payload.method]));

		await client.push({ mutations: [{ id: 'm1', table: 'customer', patch: [] }] });
		await client.pull();

		expect(events).toEqual([
			['push', 'push'],
			['sync', 'push'],
			['pull', 'pull'],
			['sync', 'pull']
		]);
	});

	test('uses all mapped tables when sync tables are omitted', async () => {
		const requests = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			tables: {
				customer: {},
				order: {}
			},
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					requests.push(request);
					return {
						data: {
							phase: 'keys',
							items: [],
							done: true,
							cursor: 'cursor-1'
						}
					};
				};
			}
		});

		await client.pull();

		expect(requests[0].data.tables).toEqual(['customer', 'order']);
	});

	test('uses client mapped tables when db object has no table map', async () => {
		const requests = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			query: async () => []
		};
		const client = newSyncClient({
			tables: {
				customer: {},
				order: {}
			},
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					requests.push(request);
					return {
						data: {
							phase: 'keys',
							items: [],
							done: true,
							cursor: 'cursor-1'
						}
					};
				};
			}
		});

		await client.pull();

		expect(requests[0].data.tables).toEqual(['customer', 'order']);
	});

	test('does not rerun internal sync table DDL after first pull', async () => {
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			queryLog: [],
			query: async function(sql) {
				this.queryLog.push(sql);
				return [];
			}
		};
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: {
						phase: 'keys',
						items: [],
						done: true,
						cursor: 'cursor-1'
					}
				});
			}
		});

		await client.pull();
		await client.pull();

		const stateTableCreates = db.queryLog.filter(x => x.includes('CREATE TABLE IF NOT EXISTS "orange_sync_state"'));
		expect(stateTableCreates).toHaveLength(1);
	});

	test('resetLocal clears ensured internal table cache', async () => {
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			queryLog: [],
			query: async function(sql) {
				this.queryLog.push(sql);
				if (/SELECT "id" FROM "orange_sync_client"/u.test(sql))
					return [];
				return [];
			}
		};
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			}
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'push', applied: 1, duplicates: 0, results: [] }
				});
			}
		});

		await client.push({ mutations: [{ id: 'm1', table: 'customer', patch: [] }] });
		await client.resetLocal({ force: true });
		await client.push({ mutations: [{ id: 'm2', table: 'customer', patch: [] }] });

		const resetDropIndex = db.queryLog.findIndex((sql) => /DROP TABLE IF EXISTS "orange_sync_client"/u.test(sql));
		const createClientTableIndexes = db.queryLog
			.map((sql, index) => /CREATE TABLE IF NOT EXISTS "orange_sync_client"/u.test(sql) ? index : -1)
			.filter((index) => index !== -1);

		expect(resetDropIndex).toBeGreaterThan(-1);
		expect(createClientTableIndexes.some((index) => index > resetDropIndex)).toBe(true);
	});

	test('applies staged pull rows with json patch and skips sqlite post-insert select', async () => {
		const patches = [];
		const options = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, schema: false },
			query: async () => []
		};
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch, patchOptions) => {
						patches.push(patch);
						options.push(patchOptions);
						return { changed: [] };
					}
				},
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					return {
						data: {
							phase: 'rows',
							items: [{ table: 'customer', pk: [1], key: { id: 1 }, row: { id: 1 }, op: 'U' }]
						}
					};
				};
			}
		});

		await client.pull();

		expect(patches).toEqual([
			[{ op: 'replace', path: '/[1]', value: { id: 1 } }]
		]);
		expect(options[0]).toMatchObject({
			concurrency: 'overwrite',
			skipSelectAfterInsert: true
		});
	});

});

function newTable(dbName) {
	return {
		_dbName: dbName,
		_columns: [
			{ alias: 'id', _dbName: 'id', tsType: 'NumberColumn', isPrimary: true }
		],
		_primaryColumns: [
			{ alias: 'id', _dbName: 'id', tsType: 'NumberColumn', isPrimary: true }
		],
		_relations: {}
	};
}
