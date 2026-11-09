import { afterEach, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
	function open(name = 'app') {
		const db = map({ db: con => con.sqlite(`capacitor:${name}`, {
			capacitorSQLite: plugin, sync: { url: `http://127.0.0.1:${server.address().port}/rdb`, auto: false, worker: false, tables: ['project'] }
		}) });
		close.push(() => db.close()); return db;
	}
	return { remote, open, plugin };
}
test('native initial sync, offline outbox across reopen, incremental publication, isolated replicas and reset', async () => {
	const { remote, open } = await fixture();
	let db = open();
	await db.syncClient.sync();
	expect((await db.project.getById('server')).title).toBe('Initial');
	await db.project.insert({ id: 'draft', title: 'Offline' });
	await db.close(); db = open();
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
