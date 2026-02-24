import { beforeAll, afterAll, beforeEach, describe, expect, test } from 'vitest';
import { json } from 'body-parser';

const express = require('express');
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

	await localDb.customer.insert([
		{ id: 1, name: 'Stale', balance: 1, isActive: true }
	]);

	const app = express();
	app.use(json({ limit: '2mb' }));
	app.use('/rdb', (request, _response, next) => {
		if (request.query.sync === 'pull')
			syncPhases.push(request.body?.phase);
		next();
	});
	app.use('/rdb', remoteDb.express({
		sync: {
			queue: { concurrency: 1, maxPending: 100 },
			limits: {
				maxTablesPerRequest: 20,
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
		const result = await localDb.syncClient.pull();

		expect(result.payload.mode).toBe('snapshot');
		expect(result.payload.reason).toBe('first_sync');
		expect(syncPhases.filter(x => x === 'keys').length).toBeGreaterThan(1);
		expect(syncPhases.filter(x => x === 'rows').length).toBeGreaterThan(1);

		const row1 = await localDb.customer.getById(1);
		const row2 = await localDb.customer.getById(2);
		const row3 = await localDb.customer.getById(3);
		expect(row1.name).toBe('George');
		expect(row2.name).toBe('Harry');
		expect(row3.name).toBe('Ron');
	});

	test('incremental sync reads PKs from change table and excludes deletes', async () => {
		await localDb.syncClient.pull();

		await remoteDb.query('UPDATE customer SET name = \'Harald\' WHERE id = 2');
		await remoteDb.query('INSERT INTO customer (id, name, balance, "isActive") VALUES (4, \'Neo\', 88, true)');
		await remoteDb.query('DELETE FROM customer WHERE id = 3');

		const second = await localDb.syncClient.pull();

		expect(second.payload.mode).toBe('changes');
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
		await localDb.syncClient.pull();
		await remoteDb.query('DELETE FROM orange_changes');
		for (let i = 0; i < 10; i++) {
			await remoteDb.query(`UPDATE customer SET balance = ${300 + i} WHERE id = 1`);
		}

		const result = await localDb.syncClient.pull();

		expect(result.payload.mode).toBe('snapshot');
		expect(['cursor_too_far_behind', 'cursor_too_old']).toContain(result.payload.reason);
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

		await localDb.syncClient.pull();

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

		await localDb.syncClient.pull();

		await remoteDb.query('UPDATE customer SET name = \'Ivar2\', balance = 50 WHERE id = 20');
		await remoteDb.query('DELETE FROM "order" WHERE id = 21');
		await remoteDb.query('DELETE FROM customer WHERE id = 21');

		const second = await localDb.syncClient.pull();

		expect(second.payload.mode).toBe('changes');
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

	test('ignores per-pull tables override and uses configured sync tables', async () => {
		await localDb.query('PRAGMA foreign_keys = ON');
		await localDb.query('DELETE FROM "order"');
		await localDb.query('DELETE FROM customer');
		await remoteDb.query('DELETE FROM "order"');
		await remoteDb.query('DELETE FROM customer');

		await remoteDb.customer.insert({
			id: 40,
			name: 'Ola',
			balance: 40,
			isActive: true
		});
		await remoteDb.order.insert({
			id: 40,
			orderDate: new Date(2022, 0, 11, 9, 24, 47),
			customerId: 40
		});

		await localDb.syncClient.pull({
			// Runtime should ignore per-pull table overrides.
			tables: ['customer']
		});

		const order = await localDb.order.getById(40);
		const customer = await localDb.customer.getById(40);
		expect(customer.name).toBe('Ola');
		expect(order.customerId).toBe(40);
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

		const first = await localDb.syncClient.pull();
		expect(first.payload.mode).toBe('snapshot');

		await remoteDb.query('UPDATE customer SET name = \'Ari2\' WHERE id = 30');

		const localDbReloaded = map({
			db: (con) => con.sqlite(localName, {
				size: 1,
				sync: syncClientConfig
			})
		});
		const second = await localDbReloaded.syncClient.pull();
		expect(second.payload.mode).toBe('changes');

		const row30 = await localDbReloaded.customer.getById(30);
		expect(row30.name).toBe('Ari2');
	});
});
