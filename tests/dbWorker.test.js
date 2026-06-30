import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const fs = require('fs');
const map = require('./db');
const initSqlite = require('./initSqlite');

const fileName = 'demo.dbWorker.test.db';
let workerDb;
let dbWorkerUiDb;
let sqliteOPFSUiDb;
let sqlWorkerDb;

beforeAll(async () => {
	workerDb = map({
		db: (con) => con.sqlite(fileName, { size: 1 })
	});
	await initSqlite(workerDb);
	const bridge = createBridge(workerDb);
	const dbWorkerClient = rdb.createDbWorkerClient(bridge.worker);
	dbWorkerUiDb = map({
		db: () => dbWorkerClient
	});

	sqlWorkerDb = map({
		db: (con) => con.sqlite('demo.sqliteOPFS.sql-worker.test.db', { size: 1 })
	});
	await initSqlite(sqlWorkerDb);
	const sqlBridge = createSqlBridge(sqlWorkerDb);
	sqliteOPFSUiDb = map({
		db: (con) => con.sqliteOPFS('app.db', { worker: sqlBridge.worker })
	});
});

afterAll(async () => {
	await rdb.close();
});

describe('db worker rpc', () => {
	test('auto-starts worker sync client by default', () => {
		let starts = 0;
		let stops = 0;
		const handler = rdb.createDbWorkerHandler({
			syncClient: {
				start: () => {
					starts += 1;
				},
				stop: () => {
					stops += 1;
				}
			}
		}, { postMessage: () => {} });

		expect(starts).toBe(1);
		handler.stop();
		expect(stops).toBe(1);
	});

	test('routes table reads and writes through worker db', async () => {
		await dbWorkerUiDb.customer.insert({ id: 9001, name: 'Worker', balance: 10, isActive: true });

		const row = await dbWorkerUiDb.customer.getById(9001);
		const raw = await workerDb.customer.getById(9001);

		expect(row.name).toBe('Worker');
		expect(raw.name).toBe('Worker');
	});

	test('routes transaction table writes through one worker transaction', async () => {
		await dbWorkerUiDb.transaction(async (tx) => {
			await tx.customer.insert({ id: 9002, name: 'TxOne', balance: 1, isActive: true });
			await tx.customer.insert({ id: 9003, name: 'TxTwo', balance: 2, isActive: true });
		});

		const rows = await workerDb.customer.getMany({
			where: x => x.id.in([9002, 9003]),
			orderBy: 'id'
		});

		expect(rows.map(x => x.name)).toEqual(['TxOne', 'TxTwo']);
	});

	test('sends transaction sync context to db worker outbox', async () => {
		const syncFileName = 'demo.dbWorker.sync-context.test.db';
		fs.rmSync(syncFileName, { force: true });
		const syncWorkerDb = map({
			db: (con) => con.sqlite(syncFileName, {
				size: 1,
				sync: { url: '/rdb', auto: false, tables: ['customer'] }
			})
		});
		await initSqlite(syncWorkerDb);
		const bridge = createBridge(syncWorkerDb);
		const workerClient = rdb.createDbWorkerClient(bridge.worker);
		const uiDb = map({
			db: workerClient
		});

		await uiDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'worker-save';
			ctx.sync.customerId = 9200;
			await tx.customer.insert({ id: 9200, name: 'WorkerSync', balance: 1, isActive: true });
		});

		const outbox = await syncWorkerDb.query('SELECT operation_name, operation_json FROM "orange_sync_outbox" WHERE status = \'pending\'');
		workerClient.close();

		expect(outbox).toHaveLength(1);
		expect(outbox[0].operation_name ?? outbox[0].OPERATION_NAME).toBe('worker-save');
		expect(JSON.parse(outbox[0].operation_json ?? outbox[0].OPERATION_JSON)).toMatchObject({
			operation: 'worker-save',
			customerId: 9200
		});
	});

	test('captures transaction sync commands through db worker outbox', async () => {
		const syncFileName = 'demo.dbWorker.sync-command.test.db';
		fs.rmSync(syncFileName, { force: true });
		const syncWorkerDb = map({
			db: (con) => con.sqlite(syncFileName, {
				size: 1,
				sync: { url: '/rdb', auto: false, tables: ['customer'] }
			}),
			commands: {
				async auditCustomer() {}
			}
		});
		await initSqlite(syncWorkerDb);
		const bridge = createBridge(syncWorkerDb);
		const workerClient = rdb.createDbWorkerClient(bridge.worker);
		const uiDb = map({
			db: workerClient,
			commands: {
				async auditCustomer() {}
			}
		});

		await uiDb.transaction(async (tx) => {
			await tx.commands.auditCustomer({ id: 9300, source: 'worker' });
			await tx.customer.insert({ id: 9300, name: 'WorkerCmd', balance: 1, isActive: true });
		});

		const outbox = await syncWorkerDb.query('SELECT patch_json FROM "orange_sync_outbox" WHERE status = \'pending\'');
		workerClient.close();

		expect(outbox).toHaveLength(1);
		const payload = JSON.parse(outbox[0].patch_json ?? outbox[0].PATCH_JSON);
		expect(payload.commands).toEqual([
			{ name: 'auditCustomer', args: { id: 9300, source: 'worker' } }
		]);
		expect(payload.patches).toHaveLength(1);
	});

	test('rolls back worker transaction on error', async () => {
		await expect(dbWorkerUiDb.transaction(async (tx) => {
			await tx.customer.insert({ id: 9004, name: 'Rollback', balance: 1, isActive: true });
			throw new Error('rollback db worker');
		})).rejects.toThrow('rollback db worker');

		const row = await workerDb.customer.getById(9004);
		expect(row).toBeUndefined();
	});

	test('sqliteOPFS routes ORM operations through sql worker adapter', async () => {
		await sqliteOPFSUiDb.customer.insert({ id: 9010, name: 'OPFS', balance: 10, isActive: true });

		const row = await sqliteOPFSUiDb.customer.getById(9010);
		const raw = await sqlWorkerDb.customer.getById(9010);

		expect(row.name).toBe('OPFS');
		expect(raw.name).toBe('OPFS');
	});

	test('mapped db worker client reuses worker sync client', async () => {
		const syncFileName = 'demo.dbWorker.sync-client.test.db';
		fs.rmSync(syncFileName, { force: true });
		const syncWorkerDb = map({
			db: (con) => con.sqlite(syncFileName, {
				size: 1,
				sync: { url: '/rdb', auto: false, tables: ['customer'] }
			})
		});
		await initSqlite(syncWorkerDb);
		const bridge = createBridge(syncWorkerDb);
		const workerClient = rdb.createDbWorkerClient(bridge.worker);
		const uiDb = map({
			db: workerClient
		});

		const config = await uiDb.syncClient.getConfig();
		workerClient.close();

		expect(config).toMatchObject({
			url: '/rdb',
			auto: false,
			tables: ['customer']
		});
	});

	test('caches sqliteOPFS provider connection across ORM operations', async () => {
		let workers = 0;
		const sqlBridge = createSqlBridge(sqlWorkerDb);
		const cachedDb = map({
			db: (con) => con.sqliteOPFS('cached-app.db', {
				createWorker: () => {
					workers += 1;
					return sqlBridge.worker;
				}
			})
		});

		await cachedDb.customer.insert({ id: 9011, name: 'CachedOPFS', balance: 10, isActive: true });
		const row = await cachedDb.customer.getById(9011);

		expect(row.name).toBe('CachedOPFS');
		expect(workers).toBe(1);
	});
});

function createBridge(db) {
	const uiListeners = new Set();
	const handler = rdb.createDbWorkerHandler(db, {
		postMessage(message) {
			for (const listener of Array.from(uiListeners))
				listener({ data: message });
		}
	});

	return {
		worker: {
			postMessage(message) {
				void handler.handleMessage({ data: message });
			},
			addEventListener(event, listener) {
				if (event === 'message')
					uiListeners.add(listener);
			},
			removeEventListener(event, listener) {
				if (event === 'message')
					uiListeners.delete(listener);
			}
		}
	};
}

function createSqlBridge(db) {
	const uiListeners = new Set();
	let opened = false;

	return {
		worker: {
			postMessage(message) {
				void handleMessage(message);
			},
			addEventListener(event, listener) {
				if (event === 'message')
					uiListeners.add(listener);
			},
			removeEventListener(event, listener) {
				if (event === 'message')
					uiListeners.delete(listener);
			}
		}
	};

	async function handleMessage(message) {
		if (!message || message.type !== 'orange-sqlite-opfs-request')
			return;
		try {
			let result;
			if (message.method === 'open') {
				opened = true;
				result = { opened: true, opfs: false };
			}
			else {
				if (!opened)
					throw new Error('sql worker is not open');
				if (message.method === 'query')
					result = await db.query({ sql: message.sql, parameters: message.parameters || [] });
				else if (message.method === 'command') {
					await db.query({ sql: message.sql, parameters: message.parameters || [] });
					result = { rowsAffected: 1, lastInsertRowid: 0 };
				}
				else
					throw new Error(`Unknown sql worker method "${message.method}"`);
			}
			postResponse(message.id, result);
		}
		catch (e) {
			postResponse(message.id, undefined, e);
		}
	}

	function postResponse(id, result, error) {
		const response = {
			type: 'orange-sqlite-opfs-response',
			id,
			result,
			error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined
		};
		for (const listener of Array.from(uiListeners))
			listener({ data: response });
	}
}
