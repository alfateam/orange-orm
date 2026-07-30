import { afterEach, describe, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const rdb = require('../src/index');
const newDualSyncDatabase = require('../src/sqliteOPFS/dualSyncDatabase');
const newSqliteDatabase = require('../src/sqlite3/newDatabase');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const map = rdb.map(({ table }) => ({
	project: table('project').map(({ column }) => ({
		id: column('id').string().primary().notNull(),
		title: column('title').string().notNull()
	}))
}));

const closeTasks = [];

afterEach(async () => {
	while (closeTasks.length > 0)
		await closeTasks.pop()();
});

describe('sqliteOPFS dual sync integration', () => {
	test('bootstraps the staging role and swaps it active', async () => {
		const remoteDb = map({
			db: con => con.pglite(undefined, { size: 1 })
		});
		closeTasks.push(() => remoteDb.close());
		await remoteDb.query('CREATE TABLE project (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
		await setupChangeTracking(remoteDb, {
			project: remoteDb.tables.project
		});
		await remoteDb.project.insert([
			{ id: 'p1', title: 'One' },
			{ id: 'p2', title: 'Two' }
		]);

		const app = express();
		app.use(express.json({ limit: '2mb' }));
		app.use('/rdb', remoteDb.express({ sync: true }));
		const server = await listen(app);
		closeTasks.push(() => closeServer(server));

		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-dual-sync-'));
		closeTasks.push(async () => fs.rmSync(directory, { recursive: true, force: true }));
		const connectionString = path.join(directory, 'local.sqlite3');
		const sync = {
			url: `http://127.0.0.1:${server.address().port}/rdb`,
			auto: false,
			tables: ['project']
		};
		const dualDb = newDualSyncDatabase(connectionString, { sync }, (roleConnectionString, options) =>
			newSqliteDatabase(roleConnectionString, {
				...options,
				size: 1
			})
		);
		const localDb = map({ db: () => dualDb });
		closeTasks.push(() => localDb.close());

		expect(await localDb.db()).toBe(dualDb);
		const resetResult = await localDb.syncClient.resetLocal();
		const beforeSync = await localDb.project.count();
		const syncResult = await localDb.syncClient.sync();
		const afterSync = await localDb.project.count();
		const roleA = map({
			db: con => con.sqlite(connectionString, { size: 1 })
		});
		const roleB = map({
			db: con => con.sqlite(appendRoleSuffix(connectionString, 'b'), { size: 1 })
		});
		closeTasks.push(() => roleA.close());
		closeTasks.push(() => roleB.close());

		expect(resetResult).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b'
		});
		expect(beforeSync).toBe(0);
		expect(syncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a'
		});
		expect(afterSync).toBe(2);
		expect(await roleA.project.count()).toBe(0);
		expect(await roleB.project.count()).toBe(2);
	}, 30000);
});

function listen(app) {
	return new Promise((resolve) => {
		const server = app.listen(0, '127.0.0.1', () => resolve(server));
	});
}

function closeServer(server) {
	return new Promise((resolve, reject) => {
		server.close((error) => error ? reject(error) : resolve());
	});
}

function appendRoleSuffix(connectionString, suffix) {
	const value = String(connectionString);
	if (value.endsWith('.sqlite3'))
		return value.slice(0, -8) + `.__orange_sync_${suffix}.sqlite3`;
	return `${value}.__orange_sync_${suffix}.sqlite3`;
}
