import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const orange = require('../src/index');
const nativePlugin = require('./nativeSqlitePlugin');
const createNative = require('../src/sqliteNative/newDatabase');
const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });
async function fixture() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-bridge-'));
	cleanup.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const plugin = nativePlugin(directory);
	const host = createNative('capacitor:bridge', { capacitorSQLite: plugin });
	cleanup.push(() => host.end());
	await host.query('CREATE TABLE item(id INTEGER PRIMARY KEY, title TEXT)');
	const bridge = host.poolFactory.__orangeConnectNativeWorker();
	cleanup.push(() => bridge.close());
	const remote = createNative('capacitor:bridge', { __orangeNativePorts: new Map([['capacitor:bridge', bridge.port]]) });
	cleanup.push(() => remote.end());
	const map = orange.map(({ table }) => ({ item: table('item').map(({ column }) => ({ id: column('id').numeric().primary(), title: column('title').string() })) }));
	return { plugin, host, bridge, db: map({ db: () => remote }) };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }

test('worker commands retain affected-row counts for saving and detecting stale edits', async () => {
	const { host, db } = await fixture();
	await db.item.insert({ id: 1, title: 'Original' });
	const row = await db.item.getById(1);
	row.title = 'Saved';
	await row.save();
	expect(await host.query('SELECT title FROM item')).toEqual([{ title: 'Saved' }]);
	await host.query("UPDATE item SET title='Changed elsewhere' WHERE id=1");
	row.title = 'Stale edit';
	await expect(row.save()).rejects.toThrow(/concurrency|changed|conflict/i);
	expect(await host.query('SELECT title FROM item')).toEqual([{ title: 'Changed elsewhere' }]);
});

test('lost worker rolls back an abandoned transaction and releases the GUI connection', async () => {
	const { host, bridge, db } = await fixture();
	const entered = deferred(), resume = deferred();
	const tx = db.transaction(async tx => { await tx.item.insert({ id: 1, title: 'Abandoned' }); entered.resolve(); await resume.promise; });
	const outcome = tx.catch(error => error);
	await entered.promise;
	const read = host.query('SELECT * FROM item');
	await bridge.close();
	expect(await read).toEqual([]);
	resume.resolve();
	expect(await outcome).toBeInstanceOf(Error);
	await host.query("INSERT INTO item VALUES (2, 'GUI write')");
	expect(await host.query('SELECT id FROM item')).toEqual([{ id: 2 }]);
});

test('disconnect drains a pending native write before rollback and release', async () => {
	const { plugin, host, bridge, db } = await fixture();
	const entered = deferred(), resume = deferred();
	const run = plugin.run;
	plugin.run = async args => {
		if (args.statement.startsWith('INSERT')) { entered.resolve(); await resume.promise; }
		return run.call(plugin, args);
	};
	const tx = db.transaction(tx => tx.item.insert({ id: 1, title: 'Pending' })).catch(error => error);
	await entered.promise;
	let closed = false;
	const closing = bridge.close().then(() => { closed = true; });
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(closed).toBe(false);
	resume.resolve(); await closing;
	expect(await tx).toBeInstanceOf(Error);
	expect(await host.query('SELECT * FROM item')).toEqual([]);
});

test('worker construction failure releases lazy native pools instead of silently falling back', async () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-startup-'));
	cleanup.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const plugin = nativePlugin(directory);
	const map = orange.map(({ table }) => ({ item: table('item').map(({ column }) => ({ id: column('id').numeric().primary() })) }));
	expect(() => map({ db: con => con.sqlite('capacitor:startup', { capacitorSQLite: plugin,
		sync: { url: '/rdb', worker: { createWorker() { throw new Error('Worker blocked'); } } }
	}) })).toThrow('Worker blocked');
	await new Promise(resolve => setImmediate(resolve));
	await expect(orange.deleteSqliteNative('capacitor:startup', { capacitorSQLite: plugin, sync: true })).resolves.toBeUndefined();
});

test('worker ports reserve the target and clone committed WAL state through the host', async () => {
	const { plugin, host, db } = await fixture();
	await host.query("INSERT INTO item VALUES (1, 'Clone me')");
	const targetHost = createNative('capacitor:target', { capacitorSQLite: plugin });
	cleanup.push(() => targetHost.end());
	const bridge = targetHost.poolFactory.__orangeConnectNativeWorker();
	cleanup.push(() => bridge.close());
	const target = createNative('capacitor:target', { __orangeNativePorts: new Map([['capacitor:target', bridge.port]]) });
	cleanup.push(() => target.end());
	// Obtain the source adapter via a separate bridge, as the sync router does.
	const sourceBridge = host.poolFactory.__orangeConnectNativeWorker();
	cleanup.push(() => sourceBridge.close());
	const source = createNative('capacitor:bridge', { __orangeNativePorts: new Map([['capacitor:bridge', sourceBridge.port]]) });
	cleanup.push(() => source.end());
	const release = await target.poolFactory.__orangeAcquireDatabaseAccess();
	try {
		await target.poolFactory.__orangeSuspendDatabase();
		await source.poolFactory.__orangeCloneDatabaseTo('capacitor:target');
	} finally { await release(); }
	expect(await target.query('SELECT * FROM item')).toEqual([{ id: 1, title: 'Clone me' }]);
	expect((await db.item.getById(1)).title).toBe('Clone me');
});
