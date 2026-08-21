import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const createManagedSyncWorkerClient = require('../src/client/managedSyncWorkerClient');
const mapFromSyncSchema = require('../src/client/mapFromSyncSchema');
const { buildSyncSchema } = require('../src/client/syncSchema');

describe('managed sync worker', () => {
	test('serializes and reconstructs mapped sync tables', () => {
		const source = createMappedTables();
		const schema = buildSyncSchema(source, ['parent', 'child']);
		const rebuilt = mapFromSyncSchema(rdb, schema);

		expect(buildSyncSchema(rebuilt, ['parent', 'child'])).toEqual(schema);
	});

	test('creates a sync worker client with internal SQLite ports', () => {
		const messages = [];
		let terminated = false;
		const worker = {
			postMessage(message, transfer) {
				messages.push({ message, transfer });
			},
			addEventListener() {},
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
					worker: { createWorker: () => worker },
					dual: { bootstrap: 'data-first' }
				}
			},
			syncConfig: {
				url: '/sync',
				worker: { createWorker: () => worker },
				dual: { bootstrap: 'data-first' }
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
				singleWorker: true,
				sync: {
					url: '/sync',
					dual: { bootstrap: 'data-first' }
				}
			}
		});
		expect(messages[0].message.sqliteOptions).not.toHaveProperty('worker');
		expect(messages[0].message.sqliteOptions).not.toHaveProperty('createWorker');
		expect(messages[0].message.sync).toBeUndefined();
		expect(messages[0].message.sqlConnections.map(entry => entry.port)).toEqual(ports);
		expect(messages[0].transfer).toEqual(ports);
		expect(messages[1].message).toEqual({ type: 'orange-sync-worker-ready' });

		client.close();
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
		child: tables.child.map(({ references }) => ({
			parent: references(tables.parent).by('parentId').notNull()
		}))
	}));
}
