import { afterEach, describe, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const rdb = require('../src/index');
const newDual = require('../src/sqliteOPFS/dualSyncDatabase');
const newSqlite = require('../src/sqlite3/newDatabase');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });

function makeMap(extra = false, extraTable = false) {
	return rdb.map(({ table }) => ({
		project: table('project').map(({ column }) => ({
			id: column('id').string().primary().notNull(),
			title: column('title').string().notNull(),
			...(extra ? { description: column('description').string() } : {})
		})),
		...(extraTable ? { category: table('category').map(({ column }) => ({ id: column('id').string().primary() })) } : {})
	}));
}

async function fixture(dual) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-schema-recovery-'));
	cleanup.push(() => fs.rmSync(dir, { recursive: true, force: true }));
	const remote = makeMap(true, true)({ db: con => con.pglite(undefined, { size: 1 }) });
	cleanup.push(() => remote.close());
	await remote.query('CREATE TABLE project (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT)');
	await remote.query('CREATE TABLE category (id TEXT PRIMARY KEY)');
	await setupChangeTracking(remote, remote.tables);
	await remote.project.insert({ id: 'seed', title: 'Server', description: 'New column' });
	const requests = [];
	let status = 0, rejectTitle, omitAck = false;
	const app = express();
	app.use(express.json());
	app.use('/rdb', (req, res, next) => {
		if (req.body.phase === 'push') {
			requests.push(req.body);
			if (status) return res.status(status).send('Temporary rejection');
			if (rejectTitle && JSON.stringify(req.body.mutations).includes(rejectTitle)) return res.status(409).send('Conflict');
			if (omitAck) return res.json({ results: [] });
		}
		next();
	});
	app.use('/rdb', remote.express({ sync: true }));
	const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
	cleanup.push(() => new Promise(resolve => server.close(resolve)));
	const url = `http://127.0.0.1:${server.address().port}/rdb`;
	function open(extra = false, extraTable = false) {
		const sync = { url, auto: false, worker: false };
		const file = path.join(dir, 'local.sqlite3');
		const connection = dual ? newDual(file, { sync }, (name, opts) => newSqlite(name, { ...opts, size: 1 }))
			: newSqlite(file, { sync, size: 1 });
		const db = makeMap(extra, extraTable)({ db: () => connection });
		let closed;
		const close = () => closed ||= db.close();
		cleanup.push(close);
		return { db, close };
	}
	return { remote, requests, open, setStatus: value => { status = value; }, reject: value => { rejectTitle = value; }, omitAck: value => { omitAck = value; } };
}

for (const dual of [false, true]) describe(dual ? 'dual replica schema recovery' : 'single replica schema recovery', () => {
	test('a pure table addition bootstraps without discarding the pending queue', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'table-only', title: 'Pending during table addition' });
		await old.close();
		const next = f.open(false, true);
		await next.db.syncClient.ensureLocalSchema();
		await next.db.syncClient.sync();
		expect((await next.db.project.getById('table-only')).title).toBe('Pending during table addition');
		await next.db.syncClient.sync();
		expect((await f.remote.project.getById('table-only')).title).toBe('Pending during table addition');
	}, 30000);

	test('sends old-schema writes before resetting, including a simultaneous table addition', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'offline', title: 'Offline draft' });
		await old.close();
		const next = f.open(true, true);
		await expect(next.db.syncClient.ensureLocalSchema()).rejects.toMatchObject({ code: 'ORANGE_SYNC_SCHEMA_MISMATCH' });
		await next.db.syncClient.stop();
		expect(await next.db.syncClient.recoverLocalSchema({ discardConflicts: true })).toMatchObject({ sent: 1, discarded: 0, reset: true });
		await next.db.syncClient.start();
		expect((await next.db.project.getById('offline')).title).toBe('Offline draft');
		expect((await next.db.project.getById('seed')).description).toBe('New column');
		expect(await next.db.category.getMany()).toEqual([]);
	}, 30000);

	test('retains the queue on auth, server, rate-limit and malformed replies; retry resumes after reopening', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'offline', title: 'Keep me' });
		const before = await old.db.query('SELECT mutation_id, patch_json FROM orange_sync_outbox WHERE status = \'pending\'');
		await old.close();
		const next = f.open(true);
		for (const status of [401, 403, 429, 500, 503, 400]) {
			f.setStatus(status);
			await expect(next.db.syncClient.recoverLocalSchema({ discardConflicts: true })).rejects.toBeDefined();
			await expect(next.db.syncClient.ensureLocalSchema()).rejects.toMatchObject({ code: 'ORANGE_SYNC_SCHEMA_MISMATCH' });
		}
		f.setStatus(0); f.omitAck(true);
		await expect(next.db.syncClient.recoverLocalSchema()).rejects.toMatchObject({ code: 'ORANGE_SYNC_RECOVERY_BLOCKED' });
		await next.close();
		// Old mapping can still read the untouched data and persisted queue.
		const inspect = f.open();
		expect((await inspect.db.project.getById('offline')).title).toBe('Keep me');
		expect(await inspect.db.query('SELECT mutation_id, patch_json FROM orange_sync_outbox WHERE status = \'pending\'')).toEqual(before);
		await inspect.close();
		f.omitAck(false);
		const retry = f.open(true);
		await retry.db.syncClient.recoverLocalSchema();
		await retry.db.syncClient.sync();
		expect((await retry.db.project.getById('offline')).title).toBe('Keep me');
		expect(new Set(f.requests.map(request => request.mutations[0].id)).size).toBe(1);
		expect(new Set(f.requests.map(request => request.clientId)).size).toBe(1);
	}, 30000);

	test('discards only explicit 409 mutations with opt-in and sends the remaining queue', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'rejected', title: 'Reject this' });
		await old.db.project.insert({ id: 'accepted', title: 'Keep this' });
		await old.close();
		const next = f.open(true);
		f.reject('Reject this');
		await expect(next.db.syncClient.recoverLocalSchema()).rejects.toBeDefined();
		expect(await next.db.syncClient.recoverLocalSchema({ discardConflicts: true })).toMatchObject({ discarded: 1, reset: true });
		await next.db.syncClient.sync();
		expect(await next.db.project.getById('rejected')).toBeUndefined();
		expect((await next.db.project.getById('accepted')).title).toBe('Keep this');
		expect(f.requests.every(request => request.mutations.length === 1)).toBe(true);
	}, 30000);

	test('stop cancels recovery without resetting and a later open can still send', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'interrupted', title: 'Keep after stop' });
		await old.close();
		const next = f.open(true);
		let entered, release;
		const entering = new Promise(resolve => { entered = resolve; });
		const gate = new Promise(resolve => { release = resolve; });
		next.db.syncClient.interceptors.request.use(async config => { entered(); await gate; return config; });
		const result = next.db.syncClient.recoverLocalSchema().catch(error => error);
		await entering;
		await next.db.syncClient.stop();
		expect(await result).toMatchObject({ code: 'ORANGE_SYNC_ABORT' });
		release();
		await next.close();
		const retry = f.open(true);
		await retry.db.syncClient.recoverLocalSchema();
		await retry.db.syncClient.sync();
		expect((await retry.db.project.getById('interrupted')).title).toBe('Keep after stop');
	}, 30000);

	test('deduplicates a send accepted by the server whose response was lost', async () => {
		const f = await fixture(dual), old = f.open();
		await old.db.syncClient.sync();
		await old.db.project.insert({ id: 'once', title: 'Only once' });
		await old.close();
		const next = f.open(true);
		next.db.syncClient.interceptors.response.use(response => {
			if (response.config?.data?.phase === 'push') throw new Error('Lost response');
			return response;
		});
		// An interceptor failure after the HTTP response simulates uncertain delivery.
		await expect(next.db.syncClient.recoverLocalSchema()).rejects.toThrow('Lost response');
		expect((await f.remote.project.getById('once')).title).toBe('Only once');
		await next.close();
		const retry = f.open(true);
		await retry.db.syncClient.recoverLocalSchema();
		await retry.db.syncClient.sync();
		expect((await retry.db.project.getMany()).filter(row => row.id === 'once')).toHaveLength(1);
		expect(f.requests[0].clientId).toBe(f.requests[1].clientId);
		expect(f.requests[0].mutations[0].id).toBe(f.requests[1].mutations[0].id);
	}, 30000);
});
