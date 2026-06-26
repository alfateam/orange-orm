import { afterAll, describe, expect, test } from 'vitest';
import { json } from 'body-parser';

const express = require('express');
const rdb = require('../src/index');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const syncMap = rdb.map((x) => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string()
	})),
	order: x.table('order').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderDate: column('orderDate').date(),
		customerId: column('customerId').numeric()
	}))
})).map((x) => ({
	customer: x.customer.map(({ hasMany }) => ({
		orders: hasMany(x.order).by('customerId')
	})),
	order: x.order.map(({ references }) => ({
		customer: references(x.customer).by('customerId')
	}))
}));

let server;

afterAll(async () => {
	await new Promise((resolve) => {
		if (!server)
			return resolve();
		server.close(resolve);
	});
	await rdb.close();
});

describe('sqlite auto sync schema foreign keys', () => {
	test('rolls back pull and leaves checkpoint unchanged when a referenced row is missing', async () => {
		const remoteDb = syncMap({
			db: (con) => con.pglite(undefined, { size: 1 })
		});
		await initRemoteWithoutForeignKeys(remoteDb);
		await setupChangeTracking(remoteDb, {
			customer: remoteDb.tables.customer,
			order: remoteDb.tables.order
		});
		await remoteDb.query('INSERT INTO "order" (id, "orderDate", "customerId") VALUES (1, CURRENT_TIMESTAMP, 999)');

		const app = express();
		app.use(json({ limit: '2mb' }));
		app.use('/rdb', remoteDb.express({
			sync: {
				limits: {
					maxKeysPerBatch: 1,
					maxRowsPerBatch: 1
				}
			}
		}));
		server = await listen(app);
		const { port } = server.address();
		const localName = `demo.sqlite.syncSchemaFk.${Date.now()}.${process.pid}.db`;
		const localDb = syncMap({
			db: (con) => con.sqlite(localName, {
				size: 1,
				sync: {
					url: `http://localhost:${port}/rdb`,
					tables: ['customer', 'order'],
					pull: {
						maxKeysPerBatch: 1,
						maxRowsPerBatch: 1
					}
				}
			})
		});
		await localDb.query('PRAGMA foreign_keys = ON');

		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Foreign key validation failed after sync apply');

		const order = await localDb.order.getById(1);
		const stateRows = await localDb.query('SELECT * FROM "orange_sync_state"');
		expect(order).toBeUndefined();
		expect(stateRows).toEqual([]);
	});
});

async function initRemoteWithoutForeignKeys(db) {
	await db.query('CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT)');
	await db.query('CREATE TABLE "order" (id INTEGER PRIMARY KEY, "orderDate" TIMESTAMP, "customerId" INTEGER)');
}

function listen(app) {
	return new Promise((resolve) => {
		const nextServer = app.listen(0, () => resolve(nextServer));
	});
}
