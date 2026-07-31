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
	test('streams bootstrap batches and replays incremental deltas across roles', async () => {
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
			tables: ['project'],
			pull: {
				maxKeysPerBatch: 1,
				maxRowsPerBatch: 1
			}
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
		const deltaDb = map({
			db: con => con.sqlite(appendRoleSuffix(connectionString, 'delta'), { size: 1 })
		});
		closeTasks.push(() => roleA.close());
		closeTasks.push(() => roleB.close());
		closeTasks.push(() => deltaDb.close());

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
		const storedDeltaChunks = await deltaDb.query('SELECT "items_json" FROM "orange_sync_dual_delta_chunk" ORDER BY "chunk_index"');
		expect(storedDeltaChunks).toHaveLength(1);
		expect(JSON.parse(storedDeltaChunks[0].items_json)).toHaveLength(2);

		const localProject = await localDb.project.getById('p1');
		localProject.title = 'One pushed locally';
		await localProject.saveChanges();
		const pushSyncResult = await localDb.syncClient.sync();
		const pushedRemoteProject = await remoteDb.project.getById('p1');

		expect(pushSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b'
		});
		expect(pushedRemoteProject.title).toBe('One pushed locally');
		expect((await localDb.project.getById('p1')).title).toBe('One pushed locally');

		await remoteDb.project.update({ title: 'Two updated' }, { where: x => x.id.eq('p2') });
		await remoteDb.project.insert({ id: 'p3', title: 'Three' });
		const secondSyncResult = await localDb.syncClient.sync();

		expect(secondSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a'
		});
		expect(await localDb.project.count()).toBe(3);
		expect(await roleA.project.count()).toBe(2);
		expect(await roleB.project.count()).toBe(3);

		const pullStarted = deferred();
		const releasePull = deferred();
		let pauseNextPull = true;
		const interceptorId = localDb.syncClient.interceptors.request.use(async config => {
			if (pauseNextPull && config?.data?.phase === 'keys') {
				pauseNextPull = false;
				pullStarted.resolve();
				await releasePull.promise;
			}
			return config;
		});
		const writeDuringSync = localDb.syncClient.sync();
		await pullStarted.promise;
		const projectChangedDuringSync = await localDb.project.getById('p2');
		projectChangedDuringSync.title = 'Two changed during swap';
		await projectChangedDuringSync.saveChanges();
		releasePull.resolve();
		const thirdSyncResult = await writeDuringSync;
		localDb.syncClient.interceptors.request.eject(interceptorId);
		expect(thirdSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b',
			swapped: true
		});
		expect((await localDb.project.getById('p2')).title).toBe('Two changed during swap');

		const fourthSyncResult = await localDb.syncClient.sync();
		expect(fourthSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a',
			swapped: true
		});
		expect((await remoteDb.project.getById('p2')).title).toBe('Two changed during swap');

		const noOpSyncResult = await localDb.syncClient.sync();
		const roleARows = await roleA.query('SELECT "id", "title" FROM "project" ORDER BY "id"');
		const roleBRows = await roleB.query('SELECT "id", "title" FROM "project" ORDER BY "id"');

		expect(noOpSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a',
			swapped: false
		});
		expect(await deltaDb.query('SELECT "id" FROM "orange_sync_dual_delta"')).toHaveLength(0);
		expect(roleARows).toEqual(roleBRows);
		const roleAClient = await roleA.query('SELECT "id" FROM "orange_sync_client" LIMIT 1');
		const roleBClient = await roleB.query('SELECT "id" FROM "orange_sync_client" LIMIT 1');
		expect(roleAClient[0].id).toBe(roleBClient[0].id);
		expect(roleBRows).toEqual([
			{ id: 'p1', title: 'One pushed locally' },
			{ id: 'p2', title: 'Two changed during swap' },
			{ id: 'p3', title: 'Three' }
		]);

		const restoreLocks = installFakeWebLocks();
		try {
			const secondDualDb = newDualSyncDatabase(connectionString, { sync }, (roleConnectionString, options) =>
				newSqliteDatabase(roleConnectionString, { ...options, size: 1 })
			);
			const secondLocalDb = map({ db: () => secondDualDb });
			closeTasks.push(() => secondLocalDb.close());
			let activeRequests = 0;
			let maxActiveRequests = 0;
			const delayRequest = async config => {
				activeRequests += 1;
				maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
				await wait(5);
				activeRequests -= 1;
				return config;
			};
			localDb.syncClient.interceptors.request.use(delayRequest);
			secondLocalDb.syncClient.interceptors.request.use(delayRequest);

			await Promise.all([
				localDb.syncClient.sync(),
				secondLocalDb.syncClient.sync()
			]);

			expect(maxActiveRequests).toBe(1);
		}
		finally {
			restoreLocks();
		}
	}, 60000);
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

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function installFakeWebLocks() {
	const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
	const locks = createSerialWebLocks();
	Object.defineProperty(globalThis, 'navigator', {
		configurable: true,
		value: { locks }
	});
	return () => {
		if (original)
			Object.defineProperty(globalThis, 'navigator', original);
		else
			delete globalThis.navigator;
	};
}

function createSerialWebLocks() {
	const tails = new Map();
	return {
		request(name, _options, fn) {
			const previous = tails.get(name) || Promise.resolve();
			const run = previous.catch(() => {}).then(fn);
			tails.set(name, run.finally(() => {
				if (tails.get(name) === run)
					tails.delete(name);
			}));
			return run;
		}
	};
}
