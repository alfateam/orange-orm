import { beforeAll, afterAll, beforeEach, describe, expect, test } from 'vitest';
import { json } from 'body-parser';

const express = require('express');
const fs = require('fs');
const map = require('./db');
const initSqlite = require('./initSqlite');
const initPg = require('./initPg');
const rdb = require('../src/index');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const localName = `demo.${fileNameWithoutExtension}.local.db`;
const port = 3020;
let server;
const syncPhases = [];
let failNextPush = false;
let failNextPushStatus;
const syncClientConfig = {
	url: `http://localhost:${port}/rdb`,
	tables: ['customer', 'order'],
	pull: {
		maxKeysPerBatch: 1,
		maxRowsPerBatch: 1
	}
};

const remoteDb = map({
	db: (con) => con.pglite(undefined, { size: 1 })
});

const localDb = map({
	db: (con) => con.sqlite(localName, {
		size: 1,
		sync: syncClientConfig
	})
});

beforeAll(async () => {
	fs.rmSync(localName, { force: true });
	await initPg(remoteDb);
	await setupChangeTracking(remoteDb, {
		customer: remoteDb.tables.customer,
		order: remoteDb.tables.order
	});
	await initSqlite(localDb);

	await remoteDb.customer.insert([
		{ id: 1, name: 'George', balance: 177, isActive: true },
		{ id: 2, name: 'Harry', balance: 200, isActive: true },
		{ id: 3, name: 'Ron', balance: 99, isActive: true }
	]);

	await localDb.query('INSERT INTO customer (id, name, balance, isActive) VALUES (1, \'Stale\', 1, 1)');

	const app = express();
	app.use(json({ limit: '2mb' }));
	app.use('/rdb', (request, _response, next) => {
		if (request.query.sync === 'pull')
			syncPhases.push(request.body?.phase);
		next();
	});
	app.use('/rdb', (request, response, next) => {
		if (request.query.sync === 'push' && (failNextPush || failNextPushStatus)) {
			const status = failNextPushStatus || 503;
			failNextPush = false;
			failNextPushStatus = undefined;
			response.status(status).json({ error: 'forced push failure' });
			return;
		}
		next();
	});
	app.use('/rdb', remoteDb.express({
		sync: {
			queue: { concurrency: 1, maxPending: 100 },
			limits: {
				maxKeysPerBatch: 1,
				maxRowsPerBatch: 1,
				maxChangeWindow: 3
			}
		}
	}));

	await new Promise((resolve) => {
		server = app.listen(port, resolve);
	});
});

beforeEach(async () => {
	syncPhases.length = 0;
	failNextPush = false;
	failNextPushStatus = undefined;
	await localDb.query('DROP TABLE IF EXISTS "orange_sync_state"');
});

afterAll(async () => {
	await new Promise((resolve) => {
		if (!server)
			return resolve();
		server.close(resolve);
	});
	await rdb.close();
});

describe('sqlite staged pull sync', () => {
	test('first sync uses snapshot and fetches in key/row batches', async () => {
		await localDb.syncClient.sync();

		expect(syncPhases.filter(x => x === 'keys').length).toBeGreaterThan(1);
		expect(syncPhases.filter(x => x === 'rows').length).toBeGreaterThan(1);

		const row1 = await localDb.customer.getById(1);
		const row2 = await localDb.customer.getById(2);
		const row3 = await localDb.customer.getById(3);
		expect(row1.name).toBe('George');
		expect(row2.name).toBe('Harry');
		expect(row3.name).toBe('Ron');
	});

	test('emits initial-ready when initial staged sync has completed', async () => {
		const readyPromise = new Promise((resolve) => {
			localDb.syncClient.once('initial-ready', resolve);
		});

		await localDb.syncClient.sync();
		const ready = await readyPromise;

		expect(ready.source).toBe('sync');
		expect(ready.tables).toEqual(expect.arrayContaining(['customer', 'order']));
		expect(ready.since).not.toBeUndefined();
	});

	test('emits operation success with serialized context and in-memory context', async () => {
		await remoteDb.customer.insert({
			id: 9100,
			name: 'OpBase',
			balance: 10,
			isActive: true
		});
		await localDb.syncClient.sync();

		const events = [];
		const unsubscribe = localDb.syncClient.onOperation('customer-save', event => events.push(event));
		await localDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'customer-save';
			ctx.sync.customerId = 9100;
			ctx.memory.beforeName = 'OpBase';
			const row = await tx.customer.getById(9100);
			row.name = 'OpSaved';
			await row.saveChanges();
		});

		await localDb.syncClient.sync();
		unsubscribe();

		expect(events).toHaveLength(1);
		expect(events[0].ok).toBe(true);
		expect(events[0].operation).toBe('customer-save');
		expect(events[0].context).toMatchObject({ operation: 'customer-save', customerId: 9100 });
		expect(events[0].memory).toMatchObject({ beforeName: 'OpBase' });

		const remote = await remoteDb.customer.getById(9100);
		expect(remote.name).toBe('OpSaved');
	});

	test('flushes replaced sync context set after the first transaction write', async () => {
		await remoteDb.customer.insert({
			id: 9101,
			name: 'RepBase',
			balance: 11,
			isActive: true
		});
		await localDb.syncClient.sync();

		const events = [];
		const unsubscribe = localDb.syncClient.onOperation('customer-replace', event => events.push(event));
		await localDb.transaction(async (tx, ctx) => {
			const row = await tx.customer.getById(9101);
			row.name = 'RepSaved';
			await row.saveChanges();
			ctx.sync = { operation: 'customer-replace', customerId: 9101 };
		});

		await localDb.syncClient.sync();
		unsubscribe();

		expect(events).toHaveLength(1);
		expect(events[0].ok).toBe(true);
		expect(events[0].context).toMatchObject({ operation: 'customer-replace', customerId: 9101 });
	});

	test('rolls back when sync context is not JSON serializable', async () => {
		await remoteDb.customer.insert({
			id: 9103,
			name: 'SerBase',
			balance: 13,
			isActive: true
		});
		await localDb.syncClient.sync();

		await expect(localDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'bad-sync';
			ctx.sync.notJson = BigInt(1);
			const row = await tx.customer.getById(9103);
			row.name = 'BadSync';
			await row.saveChanges();
		})).rejects.toThrow('ctx.sync must be JSON serializable');

		const row = await localDb.customer.getById(9103);
		expect(row.name).toBe('SerBase');
	});

	test('emits retryable auth operation event and keeps pending outbox', async () => {
		await remoteDb.customer.insert({
			id: 9102,
			name: 'AuthBase',
			balance: 12,
			isActive: true
		});
		await localDb.syncClient.sync();

		const events = [];
		const unsubscribe = localDb.syncClient.onOperation('customer-auth', event => events.push(event));
		await localDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'customer-auth';
			ctx.sync.customerId = 9102;
			const row = await tx.customer.getById(9102);
			row.name = 'AuthPend';
			await row.saveChanges();
		});

		failNextPushStatus = 401;
		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 401');
		unsubscribe();

		const pending = await localDb.query('SELECT mutation_id, attempts, last_error FROM "orange_sync_outbox" WHERE status = \'pending\'');
		expect(events).toHaveLength(1);
		expect(events[0].ok).toBe(false);
		expect(events[0].retryable).toBe(true);
		expect(events[0].error.kind).toBe('auth');
		expect(pending).toHaveLength(1);
		expect(Number(pending[0].attempts ?? pending[0].ATTEMPTS)).toBe(1);

		await localDb.syncClient.sync();
	});

	test('incremental sync reads PKs from change table and excludes deletes', async () => {
		await localDb.syncClient.sync();
		syncPhases.length = 0;

		await remoteDb.query('UPDATE customer SET name = \'Harald\' WHERE id = 2');
		await remoteDb.query('INSERT INTO customer (id, name, balance, "isActive") VALUES (4, \'Neo\', 88, true)');
		await remoteDb.query('DELETE FROM customer WHERE id = 3');

		await localDb.syncClient.sync();

		expect(syncPhases.filter(x => x === 'keys').length).toBeGreaterThan(0);
		expect(syncPhases.filter(x => x === 'rows').length).toBeGreaterThan(0);

		const row2 = await localDb.customer.getById(2);
		const row3 = await localDb.customer.getById(3);
		const row4 = await localDb.customer.getById(4);
		expect(row2.name).toBe('Harald');
		expect(row4.name).toBe('Neo');
		expect(row3).toBeUndefined();
	});

	test('falls back to snapshot when cursor is too far behind', async () => {
		await localDb.syncClient.sync();
		await remoteDb.query('DELETE FROM orange_changes');
		for (let i = 0; i < 10; i++) {
			await remoteDb.query(`UPDATE customer SET balance = ${300 + i} WHERE id = 1`);
		}

		await localDb.syncClient.sync();

		const row1 = await localDb.customer.getById(1);
		expect(row1.balance).toBe(309);
	}, 15000);

	test('handles dependent tables even when keys are fetched in child-first batches', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');

		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert({
			id: 10,
			name: 'Alf',
			balance: 10,
			isActive: true
		});
		await remoteDb.order.insert({
			id: 10,
			orderDate: new Date(2022, 0, 11, 9, 24, 47),
			customerId: 10
		});

		await localDb.syncClient.sync();

		const order = await localDb.order.getById(10);
		const customer = await localDb.customer.getById(10);
		expect(order.customerId).toBe(10);
		expect(customer.name).toBe('Alf');
	});

	test('incremental sync applies mixed updates and deletes across dependent tables', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');

		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert([
			{ id: 20, name: 'Ivar', balance: 20, isActive: true },
			{ id: 21, name: 'Nina', balance: 21, isActive: true }
		]);
		await remoteDb.order.insert([
			{ id: 20, orderDate: new Date(2022, 0, 11, 9, 24, 47), customerId: 20 },
			{ id: 21, orderDate: new Date(2022, 0, 11, 9, 24, 47), customerId: 21 }
		]);

		await localDb.syncClient.sync();
		syncPhases.length = 0;

		await remoteDb.query('UPDATE customer SET name = \'Ivar2\', balance = 50 WHERE id = 20');
		await remoteDb.query('DELETE FROM "order" WHERE id = 21');
		await remoteDb.query('DELETE FROM customer WHERE id = 21');

		await localDb.syncClient.sync();

		expect(syncPhases.filter(x => x === 'keys').length).toBeGreaterThan(0);
		expect(syncPhases.filter(x => x === 'rows').length).toBeGreaterThan(0);

		const customer20 = await localDb.customer.getById(20);
		const customer21 = await localDb.customer.getById(21);
		const order20 = await localDb.order.getById(20);
		const order21 = await localDb.order.getById(21);

		expect(customer20.name).toBe('Ivar2');
		expect(customer20.balance).toBe(50);
		expect(order20.customerId).toBe(20);
		expect(order21).toBeUndefined();
		expect(customer21).toBeUndefined();
	});

	test('rejects per-sync tables override', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');

		await expect(localDb.syncClient.sync({
			tables: ['customer']
		})).rejects.toThrow('Unsupported sync option "tables"');
	});

	test('stores sync checkpoint in local db and resumes with a new client instance', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert([
			{ id: 30, name: 'Ari', balance: 30, isActive: true },
			{ id: 31, name: 'Ben', balance: 31, isActive: true }
		]);

		await localDb.syncClient.sync();

		await remoteDb.query('UPDATE customer SET name = \'Ari2\' WHERE id = 30');

		const localDbReloaded = map({
			db: (con) => con.sqlite(localName, {
				size: 1,
				sync: syncClientConfig
			})
		});
		await localDbReloaded.syncClient.sync();

		const row30 = await localDbReloaded.customer.getById(30);
		expect(row30.name).toBe('Ari2');
	});

	test('waitForInitialReady resolves immediately when staged db is already valid', async () => {
		await localDb.syncClient.sync();

		const localDbReloaded = map({
			db: (con) => con.sqlite(localName, {
				size: 1,
				sync: syncClientConfig
			})
		});

		const ready = await localDbReloaded.syncClient.waitForInitialReady();
		expect(ready.source).toBe('persisted');
		expect(ready.tables).toEqual(expect.arrayContaining(['customer', 'order']));
		expect(ready.since).not.toBeUndefined();
	});

	test('sync pushes pending local json patch once', async () => {
		await remoteDb.customer.insert({
			id: 60,
			name: 'Before',
			balance: 60,
			isActive: true
		});
		await localDb.syncClient.sync();
		const beforeRows = await remoteDb.query('SELECT COUNT(*) AS count FROM orange_changes');
		const beforeCount = Number(beforeRows[0].count ?? beforeRows[0].COUNT);

		const localRow = await localDb.customer.getById(60);
		localRow.name = 'After';
		await localRow.saveChanges();

		await localDb.syncClient.sync();
		await localDb.syncClient.sync();

		const row = await remoteDb.customer.getById(60);
		const afterRows = await remoteDb.query('SELECT COUNT(*) AS count FROM orange_changes');
		const afterCount = Number(afterRows[0].count ?? afterRows[0].COUNT);

		expect(row.name).toBe('After');
		expect(afterCount).toBe(beforeCount + 1);
	});

	test('sync push conflict returns http 409', async () => {
		await remoteDb.customer.insert({
			id: 61,
			name: 'Remote',
			balance: 61,
			isActive: true
		});
		await localDb.syncClient.sync();

		const localRow = await localDb.customer.getById(61);
		localRow.name = 'Local';
		await localRow.saveChanges();
		await remoteDb.query('UPDATE customer SET name = \'Remote2\' WHERE id = 61');

		let error;
		try {
			await localDb.syncClient.sync();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toBe('Request failed with status code 409');
		expect(error?.response?.status).toBe(409);
		expect(error?.response?.data).toBe('The row was changed by another user.');
	});

	test('captures multiple saveChanges in one local transaction as one push mutation', async () => {
		await localDb.query('DROP TABLE IF EXISTS "orange_sync_outbox"');
		await localDb.query('DELETE FROM customer WHERE id IN (70, 71)');
		await remoteDb.query('DELETE FROM customer WHERE id IN (70, 71)');
		await remoteDb.customer.insert([
			{ id: 70, name: 'One', balance: 70, isActive: true },
			{ id: 71, name: 'Two', balance: 71, isActive: true }
		]);
		await localDb.customer.insert([
			{ id: 70, name: 'One', balance: 70, isActive: true },
			{ id: 71, name: 'Two', balance: 71, isActive: true }
		]);
		await localDb.query('DROP TABLE IF EXISTS "orange_sync_outbox"');

		await localDb.transaction(async (tx) => {
			const one = await tx.customer.getById(70);
			one.name = 'One2';
			await one.saveChanges();

			const two = await tx.customer.getById(71);
			two.name = 'Two2';
			await two.saveChanges();
		});

		const outboxRows = await localDb.query('SELECT mutation_id, table_name, patch_json FROM "orange_sync_outbox" WHERE status = \'pending\'');
		expect(outboxRows).toHaveLength(1);
		expect(outboxRows[0].table_name ?? outboxRows[0].TABLE_NAME).toBe('*');
		expect(JSON.parse(outboxRows[0].patch_json ?? outboxRows[0].PATCH_JSON)).toHaveLength(2);

		await localDb.syncClient.sync();
		const oneRemote = await remoteDb.customer.getById(70);
		const twoRemote = await remoteDb.customer.getById(71);

		expect(oneRemote.name).toBe('One2');
		expect(twoRemote.name).toBe('Two2');
	});

	test('keeps pending mutations after transient push failure', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert([
			{ id: 80, name: 'Base80', balance: 80, isActive: true },
			{ id: 81, name: 'Base81', balance: 81, isActive: true }
		]);
		await localDb.syncClient.sync();

		const first = await localDb.customer.getById(80);
		first.name = 'Fail80';
		await first.saveChanges();

		const second = await localDb.customer.getById(81);
		second.name = 'Replay81';
		await second.saveChanges();

		failNextPush = true;
		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 503');

		const row80 = await localDb.customer.getById(80);
		const row81 = await localDb.customer.getById(81);
		const remote80 = await remoteDb.customer.getById(80);
		const pending = await localDb.query('SELECT mutation_id, patch_json FROM "orange_sync_outbox" WHERE status = \'pending\' ORDER BY created_at_ms');

		expect(row80.name).toBe('Fail80');
		expect(row81.name).toBe('Replay81');
		expect(remote80.name).toBe('Base80');
		expect(pending).toHaveLength(2);
		expect(pending[0].patch_json ?? pending[0].PATCH_JSON).toContain('Fail80');
		expect(pending[1].patch_json ?? pending[1].PATCH_JSON).toContain('Replay81');

		await localDb.syncClient.sync();
		const retriedRemote80 = await remoteDb.customer.getById(80);
		const retriedRemote81 = await remoteDb.customer.getById(81);
		const afterRetryPending = await localDb.query('SELECT mutation_id, patch_json FROM "orange_sync_outbox" WHERE status = \'pending\' ORDER BY created_at_ms');

		expect(retriedRemote80.name).toBe('Fail80');
		expect(retriedRemote81.name).toBe('Replay81');
		expect(afterRetryPending).toHaveLength(0);
	});

	test('conflict discards one pending mutation and keeps the next pending', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert([
			{ id: 83, name: 'Base83', balance: 83, isActive: true },
			{ id: 84, name: 'Base84', balance: 84, isActive: true }
		]);
		await localDb.syncClient.sync();

		const conflictEvents = [];
		const unsubscribeConflict = localDb.syncClient.onOperation('customer-conflict', event => conflictEvents.push(event));
		await localDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'customer-conflict';
			ctx.sync.customerId = 83;
			const first = await tx.customer.getById(83);
			first.name = 'Conflict83';
			await first.saveChanges();
		});

		await remoteDb.query('UPDATE customer SET name = \'Remote83\' WHERE id = 83');

		const second = await localDb.customer.getById(84);
		second.name = 'Replay84';
		await second.saveChanges();

		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 409');
		unsubscribeConflict();

		const row83 = await localDb.customer.getById(83);
		const row84 = await localDb.customer.getById(84);
		const remote84 = await remoteDb.customer.getById(84);
		const pending = await localDb.query('SELECT mutation_id, patch_json FROM "orange_sync_outbox" WHERE status = \'pending\' ORDER BY created_at_ms');
		const failed = await localDb.query('SELECT operation_name FROM "orange_sync_outbox" WHERE status = \'failed\' AND operation_name = \'customer-conflict\'');

		expect(row83.name).toBe('Base83');
		expect(row84.name).toBe('Replay84');
		expect(remote84.name).toBe('Base84');
		expect(conflictEvents).toHaveLength(1);
		expect(conflictEvents[0].ok).toBe(false);
		expect(conflictEvents[0].retryable).toBe(false);
		expect(conflictEvents[0].error.kind).toBe('conflict');
		expect(failed).toHaveLength(1);
		expect(pending).toHaveLength(1);
		expect(pending[0].patch_json ?? pending[0].PATCH_JSON).toContain('Replay84');

		await localDb.syncClient.sync();
		const pushedRemote84 = await remoteDb.customer.getById(84);
		const afterPushPending = await localDb.query('SELECT mutation_id FROM "orange_sync_outbox" WHERE status = \'pending\'');

		expect(pushedRemote84.name).toBe('Replay84');
		expect(afterPushPending).toHaveLength(0);
	});

	test('conflict after an accepted push replays pushed and later pending mutations', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await localDb.query('DELETE FROM "orange_sync_outbox"');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert([
			{ id: 85, name: 'Base85', balance: 85, isActive: true },
			{ id: 86, name: 'Base86', balance: 86, isActive: true },
			{ id: 87, name: 'Base87', balance: 87, isActive: true }
		]);
		await localDb.syncClient.sync();

		const first = await localDb.customer.getById(85);
		first.name = 'Accepted85';
		await first.saveChanges();

		await localDb.transaction(async (tx, ctx) => {
			ctx.sync.operation = 'customer-conflict';
			ctx.sync.customerId = 86;
			const second = await tx.customer.getById(86);
			second.name = 'Conflict86';
			await second.saveChanges();
		});

		const third = await localDb.customer.getById(87);
		third.name = 'Replay87';
		await third.saveChanges();

		await remoteDb.query('UPDATE customer SET name = \'Remote86\' WHERE id = 86');

		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 409');

		const local85 = await localDb.customer.getById(85);
		const local86 = await localDb.customer.getById(86);
		const local87 = await localDb.customer.getById(87);
		const remote85 = await remoteDb.customer.getById(85);
		const remote87 = await remoteDb.customer.getById(87);
		const replayRows = await localDb.query('SELECT status, patch_json FROM "orange_sync_outbox" WHERE status IN (\'pending\', \'pushed\') ORDER BY created_at_ms');
		const failed = await localDb.query('SELECT operation_name FROM "orange_sync_outbox" WHERE status = \'failed\' AND operation_name = \'customer-conflict\'');

		expect(local85.name).toBe('Accepted85');
		expect(local86.name).toBe('Base86');
		expect(local87.name).toBe('Replay87');
		expect(remote85.name).toBe('Accepted85');
		expect(remote87.name).toBe('Base87');
		expect(failed).toHaveLength(1);
		expect(replayRows.map(row => row.status ?? row.STATUS)).toEqual(['pushed', 'pending']);

		await localDb.syncClient.sync();
		const pushedRemote87 = await remoteDb.customer.getById(87);
		const openRows = await localDb.query('SELECT mutation_id FROM "orange_sync_outbox" WHERE status IN (\'pending\', \'pushed\')');

		expect(pushedRemote87.name).toBe('Replay87');
		expect(openRows).toHaveLength(0);
	});

	test('sync fails before requesting remote changes when pending push fails', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert({
			id: 82,
			name: 'Base82',
			balance: 82,
			isActive: true
		});
		await localDb.syncClient.sync();
		syncPhases.length = 0;

		const row = await localDb.customer.getById(82);
		row.name = 'Reject82';
		await row.saveChanges();

		failNextPush = true;
		await expect(localDb.syncClient.sync()).rejects.toThrow('Request failed with status code 503');

		const restored = await localDb.customer.getById(82);
		const pending = await localDb.query('SELECT mutation_id FROM "orange_sync_outbox" WHERE status = \'pending\'');

		expect(syncPhases).toHaveLength(0);
		expect(restored.name).toBe('Reject82');
		expect(pending).toHaveLength(1);
	});
});
