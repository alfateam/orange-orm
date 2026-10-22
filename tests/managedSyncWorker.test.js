import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const createManagedSyncWorkerClient = require('../src/client/managedSyncWorkerClient');
const mapFromSyncSchema = require('../src/client/mapFromSyncSchema');
const { buildSyncSchema } = require('../src/client/syncSchema');

describe('managed sync worker', () => {
	test('uses a managed worker by default when sync.worker is omitted', () => {
		const messages = [];
		let createdWorker;
		const worker = {
			postMessage(message) {
				messages.push(message);
			},
			addEventListener() {},
			removeEventListener() {},
			terminate() {}
		};
		const workerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
		const workerUrlDescriptor = Object.getOwnPropertyDescriptor(globalThis, '__orangeOrmManagedSyncWorkerUrl');
		let client;
		try {
			Object.defineProperty(globalThis, 'Worker', {
				configurable: true,
				writable: true,
				value: class {
					constructor(url, options) {
						createdWorker = { url, options };
						return worker;
					}
				}
			});
			Object.defineProperty(globalThis, '__orangeOrmManagedSyncWorkerUrl', {
				configurable: true,
				writable: true,
				value: '/managed-sync-worker.mjs'
			});
			const source = createMappedTables();
			const ports = [{ id: 'a' }, { id: 'b' }, { id: 'delta' }];
			client = createManagedSyncWorkerClient({
				client: { tables: { parent: source.parent, child: source.child } },
				connectionString: 'app.sqlite3',
				poolOptions: {
					vfs: 'opfs-sahpool',
					sync: { url: '/sync' }
				},
				syncConfig: { url: '/sync' },
				databases: ports.map((port, index) => ({
					connectionString: ['app.sqlite3', 'app.__orange_sync_b.sqlite3', 'app.__orange_sync_delta.sqlite3'][index],
					db: { poolFactory: { __orangeConnectWorkerPort: () => port } }
				}))
			});

			expect(createdWorker).toEqual({
				url: '/managed-sync-worker.mjs',
				options: { type: 'module', name: 'orange-orm-sync' }
			});
			expect(messages[0].sqliteOptions.sync).toEqual({ url: '/sync', worker: false });
		}
		finally {
			if (client)
				client.close();
			if (workerDescriptor)
				Object.defineProperty(globalThis, 'Worker', workerDescriptor);
			else
				delete globalThis.Worker;
			if (workerUrlDescriptor)
				Object.defineProperty(globalThis, '__orangeOrmManagedSyncWorkerUrl', workerUrlDescriptor);
			else
				delete globalThis.__orangeOrmManagedSyncWorkerUrl;
		}
	});

	test('serializes and reconstructs mapped sync tables', () => {
		const source = createMappedTables();
		const schema = buildSyncSchema(source, ['parent', 'child']);
		const rebuilt = mapFromSyncSchema(rdb, schema);

		expect(buildSyncSchema(rebuilt, ['parent', 'child'])).toEqual(schema);
	});

	test('preserves eager relation strategies across the managed worker boundary', () => {
		const source = createMappedTables();
		const schema = createManagedSyncWorkerClient.buildManagedSyncSchema({ tables: { parent: source.parent, child: source.child } }, {});
		const rebuilt = mapFromSyncSchema(rdb, JSON.parse(JSON.stringify(schema)));
		const { planGraph } = require('../src/sync/rowGraph');
		const strategy = { children: { parent: true } };
		expect(planGraph(rebuilt, 'parent', strategy)).toEqual(planGraph(source, 'parent', strategy));
		expect(buildSyncSchema(rebuilt, ['parent', 'child'])).toEqual(buildSyncSchema(source, ['parent', 'child']));
	});

	test('creates a sync worker client with internal SQLite ports', async () => {
		const messages = [];
		let terminated = false;
		let onMessage;
		const worker = {
			postMessage(message, transfer) {
				messages.push({ message, transfer });
				if (message.method === 'close') queueMicrotask(() => onMessage({ data: {
					type: 'orange-sync-worker-response', id: message.id
				} }));
			},
			addEventListener(event, listener) { if (event === 'message') onMessage = listener; },
			removeEventListener() {},
			terminate() {
				terminated = true;
			}
		};
		const source = createMappedTables();
		const ports = [{ id: 'a' }, { id: 'b' }, { id: 'delta' }];
		const client = createManagedSyncWorkerClient({
			client: { tables: { parent: source.parent, child: source.child } },
			connectionString: 'app.sqlite3',
			poolOptions: {
				vfs: 'opfs-sahpool',
				worker: { internal: true },
				createWorker() {},
				sync: {
					url: '/sync',
					worker: { createWorker: () => worker }
				}
			},
			syncConfig: {
				url: '/sync',
				worker: { createWorker: () => worker }
			},
			databases: ports.map((port, index) => ({
				connectionString: ['app.sqlite3', 'app.__orange_sync_b.sqlite3', 'app.__orange_sync_delta.sqlite3'][index],
				db: { poolFactory: { __orangeConnectWorkerPort: () => port } }
			}))
		});

		expect(client.__orangeManagedSyncWorker).toBe(true);
		expect(messages[0].message).toMatchObject({
			type: 'orange-managed-sync-init',
			connectionString: 'app.sqlite3',
			sqliteOptions: {
				vfs: 'opfs-sahpool',
				sync: {
					url: '/sync',
					worker: false
				}
			}
		});
		expect(messages[0].message.sqliteOptions).not.toHaveProperty('worker');
		expect(messages[0].message.sqliteOptions).not.toHaveProperty('createWorker');
		expect(messages[0].message.sync).toBeUndefined();
		expect(messages[0].message.sqlConnections.map(entry => entry.port)).toEqual(ports);
		expect(messages[0].transfer).toEqual(ports);
		expect(messages[1].message).toEqual({ type: 'orange-sync-worker-ready' });

		await client.close();
		expect(terminated).toBe(true);
	});
});

function createMappedTables() {
	return rdb.map(({ table }) => ({
		parent: table('parent_db').map(({ column }) => ({
			id: column('id_db').uuid().primary().notNull(),
			name: column('name_db').string()
		})),
		child: table('child_db').map(({ column }) => ({
			id: column('id').numeric().primary().notNull(),
			parentId: column('parent_id').uuid().notNull(),
			payload: column('payload').json(),
			at: column('at').dateWithTimeZone()
		}))
	})).map(tables => ({
		parent: tables.parent.map(({ hasMany }) => ({ children: hasMany(tables.child).by('parentId') })),
		child: tables.child.map(({ references }) => ({
			parent: references(tables.parent).by('parentId').notNull()
		}))
	}));
}
