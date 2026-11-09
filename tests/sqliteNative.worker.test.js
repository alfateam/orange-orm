import { afterEach, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { locks } = require('node:worker_threads');
Object.defineProperty(globalThis.navigator, 'locks', { value: locks, configurable: true });
const createWorker = require('./nativeWorkerHarness');
const rdb = require('../src/index');
const nativePlugin = require('./nativeSqlitePlugin');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const map = rdb.map(({ table }) => ({ project: table('project').map(({ column }) => ({
	id: column('id').string().primary().notNull(), title: column('title').string().notNull()
})) }));
const close = [];
afterEach(async () => { while (close.length) await close.pop()(); });
async function fixture() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-sync-'));
	close.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const remote = map({ db: con => con.pglite(undefined, { size: 1 }) });
	close.push(() => remote.close());
	await remote.query('CREATE TABLE project(id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
	await setupChangeTracking(remote, { project: remote.tables.project });
	await remote.project.insert({ id: 'server', title: 'Initial' });
	const app = express(); app.use(express.json()); app.use('/rdb', remote.express({ sync: true }));
	const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
	close.push(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
	const plugin = nativePlugin(directory);
	const workers = [];
	function open(name = 'app') {
		const db = map({ db: con => con.sqlite(`capacitor:${name}`, {
			capacitorSQLite: plugin, sync: { url: `http://127.0.0.1:${server.address().port}/rdb`, auto: false, worker: { createWorker: () => { const worker = createWorker(); workers.push(worker); return worker; } }, tables: ['project'] }
		}) });
		close.push(() => db.close().catch(() => {})); return db;
	}
	return { remote, open, plugin, workers };
}
test('native initial sync, offline outbox across reopen, incremental publication, isolated replicas and reset', async () => {
	const { remote, open, plugin } = await fixture();
	let db = open();
	await db.syncClient.sync();
	expect((await db.project.getById('server')).title).toBe('Initial');
	await db.project.insert({ id: 'draft', title: 'Offline' });
	// Model a new JS owner with native handles surviving: drain the old worker
	// and drop its pools, but keep all plugin connections alive across reopening.
	const closeConnection = plugin.closeConnection;
	plugin.closeConnection = async () => {};
	try { await db.close(); } finally { plugin.closeConnection = closeConnection; }
	db = open();
	expect((await db.project.getById('draft')).title).toBe('Offline');
	const other = open('other'); await other.syncClient.sync();
	expect(await other.project.getById('draft')).toBeUndefined();
	await remote.project.update({ title: 'Updated' }, remote.project.id.equal('server'));
	await db.syncClient.sync();
	expect((await remote.project.getById('draft')).title).toBe('Offline');
	expect((await db.project.getById('server')).title).toBe('Updated');
	await db.syncClient.resetLocal(); await db.syncClient.sync();
	expect((await db.project.getMany()).map(x => x.id).sort()).toEqual(['draft', 'server']);
}, 30000);
test('failed initial apply is retried after reopen, followed by durable offline edits', async () => {
	const { open, plugin } = await fixture();
	let db = open();
	plugin.failWhen(sql => /INSERT INTO "project"/i.test(sql));
	await expect(db.syncClient.sync()).rejects.toThrow('Injected native failure');
	plugin.failWhen(null);
	await db.close(); db = open();
	await db.syncClient.sync();
	expect((await db.project.getById('server')).title).toBe('Initial');
	await db.project.insert({ id: 'draft', title: 'Retained' });
	await db.close(); db = open(); await db.syncClient.sync();
	expect((await db.project.getById('draft')).title).toBe('Retained');
}, 30000);

test('busy sync worker leaves host input/reads responsive and preserves a queued local write', async () => {
	const { open, remote, workers } = await fixture();
	const db = open();
	await db.syncClient.sync();
	await db.project.getMany();
	await remote.project.update({ title: 'Changed' }, remote.project.id.equal('server'));
	const worker = workers[0];
	const paused = worker.pauseProcessing();
	const sync = db.syncClient.sync();
	try {
		await paused;
		let inputHandled = false;
		await new Promise(resolve => setTimeout(() => { inputHandled = true; resolve(); }, 10));
		expect(inputHandled).toBe(true);
		expect((await db.project.getById('server')).title).toBe('Initial');
	} finally { worker.resumeProcessing(); }
	const write = db.project.insert({ id: 'during-sync', title: 'Local' });
	await sync; await write;
	// Existing dual-sync semantics may defer publication when local writes arrive.
	await db.syncClient.sync();
	expect((await db.project.getById('server')).title).toBe('Changed');
	expect((await remote.project.getById('during-sync')).title).toBe('Local');
}, 30000);

test('worker crash drains native work, rolls back and permits reopening with offline edits intact', async () => {
	const { open, remote, plugin, workers } = await fixture();
	let db = open(); await db.syncClient.sync();
	await db.project.insert({ id: 'offline', title: 'Keep me' });
	await remote.project.update({ title: 'After crash' }, remote.project.id.equal('server'));
	let enter, release;
	const entered = new Promise(resolve => { enter = resolve; });
	const held = new Promise(resolve => { release = resolve; });
	const run = plugin.run;
	let injected = false;
	plugin.run = async args => {
		const result = await run.call(plugin, args);
		if (!injected && /INSERT INTO "project"/i.test(args.statement)) {
			injected = true; enter(); await held;
		}
		return result;
	};
	const outcome = db.syncClient.sync().catch(error => error);
	try {
		await entered;
		await workers[0].crash();
		expect(await outcome).toBeInstanceOf(Error);
	} finally { release(); }
	await expect(db.close()).rejects.toThrow('Worker exited');
	plugin.run = run;
	db = open(); await db.syncClient.sync();
	expect((await db.project.getById('offline')).title).toBe('Keep me');
	expect((await db.project.getById('server')).title).toBe('After crash');
}, 30000);
