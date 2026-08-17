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
			{ id: 'p2', title: 'Two' },
			...Array.from({ length: 1000 }, (_item, index) => ({
				id: `bootstrap-${String(index + 1).padStart(3, '0')}`,
				title: `Bootstrap ${index + 1}`
			}))
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
			auto: { enabled: false, intervalMs: 5000 },
			tables: ['project'],
			pull: {
				maxKeysPerBatch: 100,
				maxRowsPerBatch: 100
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
		const progressEvents = [];
		const pushedMutationIds = [];
		const pushedBatchSizes = [];
		const offProgress = localDb.syncClient.on('sync-progress', event => progressEvents.push(event));
		closeTasks.push(() => offProgress());
		const capturePushId = localDb.syncClient.interceptors.request.use(config => {
			if (config?.data?.phase === 'push' && Array.isArray(config.data.mutations))
				pushedBatchSizes.push(config.data.mutations.length);
			if (config?.data?.phase === 'push' && Array.isArray(config.data.mutations))
				pushedMutationIds.push(...config.data.mutations.map(mutation => mutation.id));
			return config;
		});
		closeTasks.push(() => localDb.syncClient.interceptors.request.eject(capturePushId));

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
		expect(afterSync).toBe(1002);
		expect(await roleA.project.count()).toBe(0);
		expect(await roleB.project.count()).toBe(1002);
		const storedDeltaChunks = await deltaDb.query('SELECT "items_json" FROM "orange_sync_dual_delta_chunk" ORDER BY "chunk_index"');
		expect(storedDeltaChunks).toHaveLength(2);
		expect(JSON.parse(storedDeltaChunks[0].items_json)).toHaveLength(1000);
		expect(JSON.parse(storedDeltaChunks[1].items_json)).toHaveLength(2);
		const bootstrapBatchProgress = progressEvents.filter(event => event.phase === 'pull-batch-complete');
		const bootstrapStagingSummary = progressEvents.find(event => event.phase === 'pull-staging-summary');
		expect(bootstrapBatchProgress).toHaveLength(11);
		expect(bootstrapBatchProgress.every(event =>
			event.deferredStableBase === true
			&& event.stableBaseMs === 0
			&& Number.isFinite(event.transactionMs)
		)).toBe(true);
		expect(bootstrapStagingSummary).toMatchObject({
			batchCount: 11,
			keyCount: 1002,
			rowCount: 1002,
			deferredStableBase: true,
			stableBaseMs: 0,
			failed: false
		});
		for (const roleDb of [roleA, roleB]) {
			const baseTables = await roleDb.query([
				'SELECT "name" FROM sqlite_schema',
				'WHERE "type" = \'table\' AND ("name" = \'orange_sync_base_tables\'',
				'OR "name" LIKE \'orange_sync_base_data_%\')'
			].join(' '));
			expect(baseTables).toHaveLength(0);
		}

		const localProject = await localDb.project.getById('p1');
		localProject.title = 'One pushed locally';
		await localProject.saveChanges();
		const pushSyncResult = await localDb.syncClient.sync();
		const pushedRemoteProject = await remoteDb.project.getById('p1');

		expect(pushSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b'
		});
		const bootstrapReplayProgress = progressEvents
			.filter(event => event.phase === 'applying-delta' && event.targetRole === 'a' && event.totalItems === 1002)
			.map(event => event.processedItems);
		expect(bootstrapReplayProgress).toEqual([0, 1000, 1002]);
		expect(pushedRemoteProject.title).toBe('One pushed locally');
		expect((await localDb.project.getById('p1')).title).toBe('One pushed locally');

		await remoteDb.project.update({ title: 'Two updated' }, { where: x => x.id.eq('p2') });
		await remoteDb.project.insert({ id: 'p3', title: 'Three' });
		const secondSyncResult = await localDb.syncClient.sync();

		expect(secondSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a'
		});
		expect(await localDb.project.count()).toBe(1003);
		expect(await roleA.project.count()).toBe(1002);
		expect(await roleB.project.count()).toBe(1003);

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
		const repeatedSyncs = Array.from({ length: 4 }, () => localDb.syncClient.sync());
		const projectChangedDuringSync = await localDb.project.getById('p2');
		projectChangedDuringSync.title = 'Two changed during swap';
		await projectChangedDuringSync.saveChanges();
		const pendingDuringSync = await localDb.query(
			'SELECT "mutation_id" FROM "orange_sync_outbox" WHERE "status" = \'pending\''
		);
		const mutationCreatedDuringSync = pendingDuringSync[0].mutation_id;
		releasePull.resolve();
		const [thirdSyncResult, nextSyncResult] = await Promise.all([writeDuringSync, ...repeatedSyncs]);
		localDb.syncClient.interceptors.request.eject(interceptorId);
		expect(thirdSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'b',
			stagingRole: 'a',
			swapped: false,
			deferred: 'pending-writes'
		});
		expect(nextSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b',
			swapped: true
		});
		expect(progressEvents.filter(event => event.phase === 'queued-next')).toHaveLength(1);
		expect(progressEvents.filter(event => event.phase === 'coalesced-next')).toHaveLength(3);
		expect((await localDb.project.getById('p2')).title).toBe('Two changed during swap');
		expect((await remoteDb.project.getById('p2')).title).toBe('Two changed during swap');
		expect(pushedMutationIds.filter(id => id === mutationCreatedDuringSync)).toHaveLength(1);
		expect(pushedBatchSizes.every(size => size === 1)).toBe(true);

		const fourthSyncResult = await localDb.syncClient.sync();
		expect(fourthSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b',
			swapped: false
		});
		expect((await remoteDb.project.getById('p2')).title).toBe('Two changed during swap');
		expect(pushedMutationIds.filter(id => id === mutationCreatedDuringSync)).toHaveLength(1);

		const noOpSyncResult = await localDb.syncClient.sync();
		const roleARows = await roleA.query('SELECT "id", "title" FROM "project" ORDER BY "id"');
		const roleBRows = await roleB.query('SELECT "id", "title" FROM "project" ORDER BY "id"');

		expect(noOpSyncResult.__orangeDualSync).toMatchObject({
			activeRole: 'a',
			stagingRole: 'b',
			swapped: false
		});
		expect(await deltaDb.query('SELECT "id" FROM "orange_sync_dual_delta"')).toHaveLength(0);
		expect(roleARows).toEqual(roleBRows);
		const roleAClient = await roleA.query('SELECT "id" FROM "orange_sync_client" LIMIT 1');
		const roleBClient = await roleB.query('SELECT "id" FROM "orange_sync_client" LIMIT 1');
		expect(roleAClient[0].id).toBe(roleBClient[0].id);
		expect(roleBRows).toHaveLength(1003);
		expect(roleBRows.filter(row => ['p1', 'p2', 'p3'].includes(row.id))).toEqual([
			{ id: 'p1', title: 'One pushed locally' },
			{ id: 'p2', title: 'Two changed during swap' },
			{ id: 'p3', title: 'Three' }
		]);
		expect(pushedMutationIds.filter(id => id === mutationCreatedDuringSync)).toHaveLength(1);

		await localDb.syncClient.resetLocal();
		await localDb.project.insert({
			id: 'local-before-bootstrap',
			title: 'Local before bootstrap'
		});
		const fallbackProgressStart = progressEvents.length;
		await localDb.syncClient.sync();
		const fallbackProgress = progressEvents.slice(fallbackProgressStart);
		const fallbackSummary = fallbackProgress.find(event => event.phase === 'pull-staging-summary');

		expect(fallbackSummary).toMatchObject({
			deferredStableBase: true,
			failed: false
		});
		expect((await localDb.project.getById('local-before-bootstrap')).title).toBe('Local before bootstrap');
		expect((await remoteDb.project.getById('local-before-bootstrap')).title).toBe('Local before bootstrap');

		await localDb.syncClient.sync();
		expect((await remoteDb.project.getById('local-before-bootstrap')).title).toBe('Local before bootstrap');

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

			let automaticRequests = 0;
			const countAutomaticRequest = config => {
				automaticRequests += 1;
				return config;
			};
			localDb.syncClient.interceptors.request.use(countAutomaticRequest);
			secondLocalDb.syncClient.interceptors.request.use(countAutomaticRequest);

			await Promise.all([
				localDb.syncClient.start(),
				secondLocalDb.syncClient.start()
			]);
			await localDb.syncClient.stop();
			await secondLocalDb.syncClient.stop();

			expect(automaticRequests).toBe(0);

			await secondLocalDb.syncClient.sync();
			expect(automaticRequests).toBeGreaterThan(0);
			const completionRows = await deltaDb.query(
				'SELECT "last_successful_sync_at_ms" FROM "orange_sync_dual_manifest" WHERE "id" = \'default\''
			);
			expect(Number(completionRows[0].last_successful_sync_at_ms)).toBeGreaterThan(0);
		}
		finally {
			restoreLocks();
		}
	}, 60000);

	test('sends a conflict once from active and rejects it in both roles', async () => {
		const remoteDb = map({
			db: con => con.pglite(undefined, { size: 1 })
		});
		closeTasks.push(() => remoteDb.close());
		await remoteDb.query('CREATE TABLE project (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
		await setupChangeTracking(remoteDb, {
			project: remoteDb.tables.project
		});
		await remoteDb.project.insert([
			{ id: 'conflict', title: 'Conflict base' },
			{ id: 'next', title: 'Next base' },
			{ id: 'retry', title: 'Retry base' }
		]);

		const pushedMutationIds = [];
		const pushedBatchSizes = [];
		let failNextPush = false;
		let failNextPull = false;
		const app = express();
		app.use(express.json({ limit: '2mb' }));
		app.use('/rdb', (request, response, next) => {
			if (request.body?.phase === 'push' && Array.isArray(request.body.mutations)) {
				pushedBatchSizes.push(request.body.mutations.length);
				pushedMutationIds.push(...request.body.mutations.map(mutation => mutation.id));
				if (failNextPush) {
					failNextPush = false;
					response.status(503).send('forced push failure');
					return;
				}
			}
			if (failNextPull && request.body?.phase === 'keys') {
				failNextPull = false;
				response.status(503).send('forced pull failure');
				return;
			}
			next();
		});
		app.use('/rdb', remoteDb.express({ sync: true }));
		const server = await listen(app);
		closeTasks.push(() => closeServer(server));

		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-dual-conflict-'));
		closeTasks.push(async () => fs.rmSync(directory, { recursive: true, force: true }));
		const connectionString = path.join(directory, 'local.sqlite3');
		const sync = {
			url: `http://127.0.0.1:${server.address().port}/rdb`,
			auto: false,
			tables: ['project']
		};
		const dualDb = newDualSyncDatabase(connectionString, { sync }, (roleConnectionString, options) =>
			newSqliteDatabase(roleConnectionString, { ...options, size: 1 })
		);
		const localDb = map({ db: () => dualDb });
		closeTasks.push(() => localDb.close());
		await localDb.syncClient.resetLocal();
		await localDb.syncClient.sync();

		const retry = await localDb.project.getById('retry');
		retry.title = 'Retry local';
		await retry.saveChanges();
		const retryPendingRows = await localDb.query(
			'SELECT "mutation_id" FROM "orange_sync_outbox" WHERE "status" = \'pending\''
		);
		const retryMutationId = retryPendingRows[0].mutation_id;
		failNextPush = true;
		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 503');
		const attemptedRetryRows = await localDb.query([
			'SELECT "attempts" FROM "orange_sync_outbox"',
			`WHERE "mutation_id" = '${retryMutationId}' AND "status" = 'pending'`
		].join(' '));
		expect(Number(attemptedRetryRows[0].attempts)).toBe(1);
		await localDb.syncClient.sync();
		expect((await remoteDb.project.getById('retry')).title).toBe('Retry local');
		expect(pushedMutationIds.filter(id => id === retryMutationId)).toHaveLength(2);

		const conflictEvents = [];
		const offConflict = localDb.syncClient.on(
			'operation:project-conflict',
			event => conflictEvents.push(event)
		);
		closeTasks.push(() => offConflict());
		await localDb.transaction(async (tx, context) => {
			context.context.operation = 'project-conflict';
			const project = await tx.project.getById('conflict');
			project.title = 'Conflict local';
			await project.saveChanges();
		});
		const pendingConflictRows = await localDb.query(
			'SELECT "mutation_id" FROM "orange_sync_outbox" WHERE "status" = \'pending\''
		);
		const conflictMutationId = pendingConflictRows[0].mutation_id;
		await remoteDb.project.update(
			{ title: 'Conflict remote' },
			{ where: project => project.id.eq('conflict') }
		);

		let conflictError;
		try {
			await localDb.syncClient.sync();
		}
		catch (error) {
			conflictError = error;
		}

		expect(conflictError?.message).toBe('Request failed with status code 409');
		expect(conflictError?.syncRecovered).toBe(true);
		expect(conflictError?.syncResult?.__orangeDualSync).toMatchObject({
			swapped: true
		});
		expect(conflictError?.syncResult?.__orangeDualSync.cloneMs).toBeGreaterThanOrEqual(0);
		expect(pushedMutationIds.filter(id => id === conflictMutationId)).toHaveLength(1);
		expect(pushedBatchSizes.every(size => size === 1)).toBe(true);
		expect(conflictEvents).toHaveLength(1);
		expect((await localDb.project.getById('conflict')).title).toBe('Conflict remote');

		const roleA = map({
			db: con => con.sqlite(connectionString, { size: 1 })
		});
		const roleB = map({
			db: con => con.sqlite(appendRoleSuffix(connectionString, 'b'), { size: 1 })
		});
		closeTasks.push(() => roleA.close());
		closeTasks.push(() => roleB.close());
		for (const roleDb of [roleA, roleB]) {
			expect((await roleDb.project.getById('conflict')).title).toBe('Conflict remote');
			const failed = await roleDb.query([
				'SELECT "mutation_id" FROM "orange_sync_outbox"',
				`WHERE "mutation_id" = '${conflictMutationId}' AND "status" = 'failed'`
			].join(' '));
			expect(failed).toHaveLength(1);
			const stableBaseTables = await roleDb.query([
				'SELECT "name" FROM sqlite_schema',
				'WHERE "type" = \'table\' AND ("name" = \'orange_sync_base_tables\'',
				'OR "name" LIKE \'orange_sync_base_data_%\')'
			].join(' '));
			expect(stableBaseTables).toHaveLength(0);
		}

		const next = await localDb.project.getById('next');
		next.title = 'Next local';
		await next.saveChanges();
		const nextPendingRows = await localDb.query(
			'SELECT "mutation_id" FROM "orange_sync_outbox" WHERE "status" = \'pending\''
		);
		const nextMutationId = nextPendingRows[0].mutation_id;
		failNextPull = true;
		await expect(localDb.syncClient.sync())
			.rejects.toThrow('Request failed with status code 503');

		expect((await remoteDb.project.getById('next')).title).toBe('Next local');
		expect(pushedMutationIds.filter(id => id === nextMutationId)).toHaveLength(1);
		await localDb.syncClient.sync();

		expect((await remoteDb.project.getById('next')).title).toBe('Next local');
		expect(pushedMutationIds.filter(id => id === nextMutationId)).toHaveLength(1);
		expect(pushedMutationIds.filter(id => id === conflictMutationId)).toHaveLength(1);
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
