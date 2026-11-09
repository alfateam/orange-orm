import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const rdb = require('../src/index');
const newDatabase = require('../src/sqliteNative/newDatabase');
const nativePlugin = require('./nativeSqlitePlugin');
const close = [];
afterEach(async () => { while (close.length) await close.pop()(); });
function fixture() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-'));
	close.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const plugin = nativePlugin(directory);
	const open = name => { const db = newDatabase(`capacitor:${name}`, { capacitorSQLite: plugin }); close.push(() => db.end()); return db; };
	return { plugin, open };
}
test('iOS column metadata restores UUID, text, numeric and null fields for reads, edits and RETURNING', async () => {
	const { open } = fixture();
	const adapter = open('ios-columns');
	const map = rdb.map(({ table }) => ({ item: table('item').map(({ column }) => ({
		id: column('id').uuid().primary(), title: column('title').string(),
		optionalId: column('optional_id').uuid(), score: column('score').numeric()
	})) }));
	const db = map({ db: () => adapter });
	await db.query('CREATE TABLE item(id TEXT PRIMARY KEY, title TEXT, optional_id TEXT, score REAL)');
	const expected = [
		{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'First', optionalId: null, score: 2.5 },
		{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Second', optionalId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', score: 7 }
	];
	for (const row of expected) await db.query({
		sql: 'INSERT INTO item VALUES (?, ?, ?, ?)', parameters: [row.id, row.title, row.optionalId?.toUpperCase() ?? null, row.score]
	});
	expect(await db.item.getMany({ orderBy: 'title' })).toEqual(expected);
	const editable = await db.item.getOne({ where: row => row.title.equal('First'), id: true, title: true });
	editable.title = 'Edited';
	await editable.save();
	expect((await db.item.getById(expected[0].id)).title).toBe('Edited');
	expect(await db.item.getMany(db.item.title.equal('Missing'))).toEqual([]);
	const returned = await db.query("UPDATE item SET score=score+1 RETURNING id, title, optional_id, score");
	expect(returned.map(row => Object.keys(row))).toEqual(expected.map(() => ['id', 'title', 'optional_id', 'score']));
	expect(returned.map(row => row.score)).toEqual([3.5, 8]);
});
test('WAL and FULL persist writes, rollback failures, and drain in-flight transactions on close', async () => {
	const { plugin, open } = fixture();
	const adapter = open('app');
	const map = rdb.map(({ table }) => ({ item: table('item').map(({ column }) => ({ id: column('id').numeric().primary(), title: column('title').string() })) }));
	const db = map({ db: () => adapter });
	await db.query('CREATE TABLE item(id INTEGER PRIMARY KEY, title TEXT)');
	expect(await db.query('PRAGMA journal_mode')).toEqual([{ journal_mode: 'wal' }]);
	expect(await db.query('PRAGMA synchronous')).toEqual([{ synchronous: 2 }]);
	await expect(db.transaction(async tx => { await tx.item.insert({ id: 1, title: 'rolled back' }); throw new Error('rollback'); })).rejects.toThrow('rollback');
	expect(await db.item.getMany()).toHaveLength(0);
	let entered, release;
	const started = new Promise(r => { entered = r; });
	const held = new Promise(r => { release = r; });
	const write = db.transaction(async tx => { await tx.item.insert({ id: 2, title: 'saved' }); entered(); await held; });
	await started;
	let readFinished = false;
	const read = db.item.getMany().then(rows => { readFinished = true; return rows; });
	await new Promise(r => setTimeout(r, 10));
	expect(readFinished).toBe(false);
	let closed = false;
	const closing = db.close().then(() => { closed = true; });
	await new Promise(r => setTimeout(r, 10)); expect(closed).toBe(false);
	release(); await write; expect((await read)[0].title).toBe('saved');
	await closing;
	const reopened = open('app');
	expect(await reopened.query('SELECT * FROM item')).toEqual([{ id: 2, title: 'saved' }]);
	expect(plugin.calls).toContain('ROLLBACK');
});
test('clones WAL data, schema, blobs and autoincrement; failed clone rolls back and can retry', async () => {
	const { plugin, open } = fixture();
	const a = open('a'), b = open('b');
	await a.query('PRAGMA wal_autocheckpoint=0');
	await a.query('CREATE TABLE item(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, data BLOB, len INT GENERATED ALWAYS AS (length(title)) STORED)');
	await a.query("INSERT INTO item(title,data) VALUES ('keep',X'010203')");
	await a.query("INSERT INTO item(id,title) VALUES (90,'removed')");
	await a.query('DELETE FROM item WHERE id=90');
	await a.query('CREATE INDEX title_index ON item(title)');
	await a.query('CREATE VIEW titles AS SELECT title FROM item');
	await b.query('CREATE TABLE obsolete(id INTEGER)');
	async function clone() {
		const release = await b.poolFactory.__orangeAcquireDatabaseAccess();
		try { await b.poolFactory.__orangeSuspendDatabase(); await a.poolFactory.__orangeCloneDatabaseTo('capacitor:b'); }
		finally { release(); }
	}
	plugin.failWhen(sql => sql.startsWith('INSERT INTO orange_clone."item"'));
	await expect(clone()).rejects.toThrow('Injected native failure');
	expect(await b.query("SELECT name FROM sqlite_master WHERE type='table'")).toEqual([{ name: 'obsolete' }]);
	plugin.failWhen(null); await clone();
	expect(await b.query('SELECT id,title,hex(data) AS data,len FROM item')).toEqual([{ id: 1, title: 'keep', data: '010203', len: 4 }]);
	expect(await b.query('SELECT * FROM titles')).toEqual([{ title: 'keep' }]);
	await b.query("INSERT INTO item(title) VALUES ('next')");
	expect(await b.query('SELECT max(id) AS id FROM item')).toEqual([{ id: 91 }]);
	expect(await a.query('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]);
	expect(await b.query('PRAGMA journal_mode')).toEqual([{ journal_mode: 'wal' }]);
});
