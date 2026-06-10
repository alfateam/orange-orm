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

	test('applies staged pull rows through sqlite upsert without table patch', async () => {
		const queries = [];
		const table = newTable('customer');
		const publicTable = {
			patch: async () => {
				throw new Error('patch should not be used for sqlite staged pull rows');
			}
		};
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, schema: false },
			query: async () => []
		};
		const client = newSyncClient({
			tables: {
				customer: table
			},
			transaction: async (fn) => fn(new Proxy({
				tables: {
					customer: table
				},
				customer: publicTable,
				query: async (query) => {
					queries.push({
						sql: typeof query.sql === 'function' ? query.sql() : query,
						parameters: query.parameters || []
					});
					return [];
				}
			}, {
				get(target, property) {
					if (property === 'rdb')
						throw new Error('public transaction rdb should not be read by sync row upsert');
					return target[property];
				}
			}))
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
							items: [{ table: 'customer', pk: [1], key: { id: 1 }, row: { id: 1, name: 'Acme' }, op: 'U' }]
						}
					};
				};
			}
		});

		await client.pull();

		expect(queries.some(x => x.sql.includes('INSERT INTO "customer"'))).toBe(true);
		expect(queries.some(x => x.sql.includes('ON CONFLICT("id")'))).toBe(true);
		expect(queries.some(x => x.sql.includes('DO UPDATE SET "name"=excluded."name"'))).toBe(true);
		expect(queries.some(x => x.sql.startsWith('SELECT') && x.sql.includes('FROM "customer"'))).toBe(false);
		expect(queries.find(x => x.sql.includes('INSERT INTO "customer"')).parameters).toEqual([1, 'Acme']);
	});
});

function newTable(dbName) {
	const idColumn = {
		alias: 'id',
		_dbName: 'id',
		tsType: 'NumberColumn',
		isPrimary: true,
		encode(_context, value) {
			return {
				sql: () => '?',
				parameters: [value]
			};
		}
	};
	return {
		_dbName: dbName,
		_columns: [
			idColumn,
			{
				alias: 'name',
				_dbName: 'name',
				tsType: 'StringColumn',
				encode(_context, value) {
					return {
						sql: () => '?',
						parameters: [value]
					};
				}
			}
		],
		_primaryColumns: [
			idColumn
		],
		_relations: {}
	};
}
