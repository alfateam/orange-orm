import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const newDatabase = require('../src/sqliteNative/newDatabase');
const nativePlugin = require('./nativeSqlitePlugin');
const close = [];
afterEach(async () => { while (close.length) await close.pop()(); });
function fixture() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-reopen-'));
	close.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const plugin = nativePlugin(directory);
	const open = name => {
		const db = newDatabase(`capacitor:${name}`, { capacitorSQLite: plugin });
		close.push(() => db.end()); return db;
	};
	async function orphan(name, opened = true) {
		const args = { database: name, readonly: false };
		await plugin.createConnection({ ...args, version: 1, encrypted: false, mode: 'no-encryption' });
		close.push(() => plugin.closeConnection(args));
		if (opened) await plugin.open(args);
		return args;
	}
	return { plugin, open, orphan };
}

test('reclaims a native handle surviving its JS session, preserves committed rows and rolls back unfinished work', async () => {
	const { plugin, open, orphan } = fixture();
	const args = await orphan('app');
	await plugin.execute({ ...args, statements: "PRAGMA journal_mode=WAL; CREATE TABLE draft(id INTEGER); INSERT INTO draft VALUES(1); BEGIN; INSERT INTO draft VALUES(2)", transaction: false });
	const other = open('other');
	await other.query('CREATE TABLE retained(id INTEGER)');
	await other.query('INSERT INTO retained VALUES(7)');
	const db = open('app');
	// Concurrent callers must share one recovery, including the first open.
	expect(await Promise.all([db.query('SELECT * FROM draft'), db.query('SELECT * FROM draft')]))
		.toEqual([[{ id: 1 }], [{ id: 1 }]]);
	expect(plugin.calls.filter(x => x === 'CLOSE CONNECTION app')).toHaveLength(1);
	expect(plugin.calls).not.toContain('CLOSE CONNECTION other');
	expect(await other.query('SELECT * FROM retained')).toEqual([{ id: 7 }]);
	expect(await db.query('PRAGMA synchronous')).toEqual([{ synchronous: 2 }]);
	expect(await db.query('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]);
	await db.query('INSERT INTO draft VALUES(3)');
	await db.end();
	expect(await open('app').query('SELECT * FROM draft')).toEqual([{ id: 1 }, { id: 3 }]);
});

test('reclaims a registered native connection that was never opened', async () => {
	const { open, orphan } = fixture();
	await orphan('delta', false);
	expect(await open('delta').query('SELECT 1 AS ready')).toEqual([{ ready: 1 }]);
});

test('a second live pool cannot reclaim the first pool, even before it opens', async () => {
	const { plugin, open } = fixture();
	const first = open('app');
	expect(() => open('app')).toThrow('already in use');
	expect(plugin.calls).toEqual([]);
	await first.query('CREATE TABLE draft(id INTEGER)');
	expect(() => open('app')).toThrow('already in use');
	expect(plugin.calls).not.toContain('CLOSE CONNECTION app');
});

test.each(['CreateConnection: permission denied', 'CreateConnection: Connection other already exists'])
('unrelated create failure does not close any connection: %s', async message => {
	const { plugin, open } = fixture();
	plugin.createConnection = async () => { throw new Error(message); };
	await expect(open('app').query('SELECT 1')).rejects.toThrow(message);
	expect(plugin.calls).toEqual([]);
});

test('failed orphan cleanup propagates before opening or recreating the connection', async () => {
	const { plugin, open, orphan } = fixture();
	await orphan('app');
	plugin.failWhen(sql => sql === 'CLOSE CONNECTION app');
	const db = open('app');
	await expect(db.query('SELECT 1')).rejects.toThrow('Injected native failure');
	expect(plugin.calls.filter(x => x === 'CREATE CONNECTION app')).toHaveLength(2);
	plugin.failWhen(null);
	expect(await db.query('SELECT 1 AS ready')).toEqual([{ ready: 1 }]);
});

test('recreation is tried only once when the plugin keeps reporting a duplicate', async () => {
	const { plugin, open } = fixture();
	let creates = 0, closes = 0;
	plugin.createConnection = async () => { creates++; throw new Error('CreateConnection: Connection app already exists'); };
	plugin.closeConnection = async () => { closes++; };
	await expect(open('app').query('SELECT 1')).rejects.toThrow('already exists');
	expect({ creates, closes }).toEqual({ creates: 2, closes: 1 });
});
