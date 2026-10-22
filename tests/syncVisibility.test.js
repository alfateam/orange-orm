import { afterEach, describe, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const orange = require('../src/index');
const newDual = require('../src/sqliteOPFS/dualSyncDatabase');
const newSqlite = require('../src/sqlite3/newDatabase');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });

const map = orange.map(x => ({
	document: x.table('documents').map(({ column }) => ({
		id: column('id').numeric().primary(),
		owner: column('owner_id').numeric().notNull(),
		isPublic: column('is_public').boolean().notNull(),
		title: column('title').string()
	})),
	note: x.table('notes').map(({ column }) => ({
		id: column('id').numeric().primary(),
		documentId: column('document_id').numeric().notNull(),
		body: column('body').string()
	}))
})).map(x => ({
	note: x.note.map(({ references }) => ({ document: references(x.document).by('documentId').notNull() }))
}));

async function fixture(dual, rls = true) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-sync-visibility-'));
	cleanup.push(() => fs.rmSync(dir, { recursive: true, force: true }));
	const remote = map.pglite(undefined, { size: 1 });
	cleanup.push(() => remote.close());
	await remote.query('CREATE TABLE documents (id integer PRIMARY KEY, owner_id integer NOT NULL, is_public boolean NOT NULL, title text)');
	await remote.query('CREATE TABLE notes (id integer PRIMARY KEY, document_id integer NOT NULL REFERENCES documents(id), body text)');
	await setupChangeTracking(remote, remote.tables);
	await remote.document.insert([
		{ id: 1, owner: 2, isPublic: true, title: 'Public then private' },
		{ id: 2, owner: 2, isPublic: true, title: 'Still public' },
		{ id: 3, owner: 2, isPublic: false, title: 'Always private' },
		{ id: 4, owner: 1, isPublic: false, title: 'My draft' }
	]);
	await remote.note.insert({ id: 10, documentId: 1, body: 'Dependent visibility' });
	await remote.query('CREATE ROLE visibility_runtime');
	await remote.query('GRANT USAGE ON SCHEMA public TO visibility_runtime');
	await remote.query('GRANT SELECT, INSERT, UPDATE, DELETE ON documents, notes TO visibility_runtime');
	await remote.query('GRANT SELECT, INSERT, UPDATE ON orange_sync_applied_mutations TO visibility_runtime');
	await remote.query('GRANT SELECT, INSERT ON orange_changes TO visibility_runtime');
	await remote.query('GRANT USAGE ON SEQUENCE orange_changes_id_seq TO visibility_runtime');
	if (rls) {
		await remote.query('ALTER TABLE documents ENABLE ROW LEVEL SECURITY');
		await remote.query('CREATE POLICY visible ON documents FOR SELECT USING (is_public OR owner_id::text = current_setting(\'test.owner\', true))');
		await remote.query('CREATE POLICY own_update ON documents FOR UPDATE USING (owner_id::text = current_setting(\'test.owner\', true))');
		await remote.query('ALTER TABLE notes ENABLE ROW LEVEL SECURITY');
		await remote.query('CREATE POLICY visible ON notes FOR SELECT USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = notes.document_id))');
	}
	await remote.query('SET ROLE visibility_runtime');
	async function asAdmin(action) {
		await remote.query('RESET ROLE');
		try { return await action(remote); }
		finally { await remote.query('SET ROLE visibility_runtime'); }
	}
	const requests = [];
	let rowFault, pushFault = false;
	const app = express().use(express.json());
	app.use('/rdb', (req, res, next) => {
		requests.push(req.body);
		if (req.body.phase === 'rows' && rowFault) {
			if (rowFault === 'malformed') return res.json({ error: 'Not a rows response' });
			return res.status(rowFault).send('Temporary row failure');
		}
		if (req.body.phase === 'push' && pushFault) return res.status(503).send('Temporary push failure');
		next();
	});
	const options = {
		document: rls ? {} : { baseFilter: (tx, req) => tx.document.isPublic.eq(true).or(tx.document.owner.eq(Number(req.get('X-Owner')))) },
		note: rls ? {} : { baseFilter: (tx, req) => tx.note.document.isPublic.eq(true).or(tx.note.document.owner.eq(Number(req.get('X-Owner')))) },
		sync: { limits: { maxRowsPerBatch: 10 } },
		hooks: { transaction: { afterBegin: async (tx, req) => {
			await tx.query({ sql: 'SELECT set_config(\'test.owner\', ?, true)', parameters: [req.get('X-Owner')] });
		} } }
	};
	const handler = remote.express(options);
	// Exercise a row limit lower than the one advertised by the key response,
	// as when a server's limits change between the two requests.
	const limitedRows = remote.express({ ...options, sync: { limits: { maxRowsPerBatch: 1 } } });
	app.use('/rdb', (req, res, next) => (req.body.phase === 'rows' ? limitedRows : handler)(req, res, next));
	const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
	cleanup.push(() => new Promise(resolve => server.close(resolve)));
	function open(owner = 1) {
		const sync = { url: `http://127.0.0.1:${server.address().port}/rdb`, auto: false, worker: false,
			pull: { maxKeysPerBatch: 100, maxRowsPerBatch: 10 } };
		const file = path.join(dir, `owner-${owner}.sqlite3`);
		const connection = dual ? newDual(file, { sync }, (name, options) => newSqlite(name, { ...options, size: 1 }))
			: newSqlite(file, { sync, size: 1 });
		const db = map({ db: () => connection });
		db.syncClient.interceptors.request.use(config => ({ ...config, headers: { ...config.headers, 'X-Owner': String(owner) } }));
		let closed;
		const close = () => closed ||= db.close();
		cleanup.push(close);
		return { db, close };
	}
	async function visibility(isPublic) {
		await asAdmin(async db => {
			await db.document.update({ isPublic }, { where: x => x.id.eq(1) });
			// Relation-dependent filters need an ordinary change key for the child.
			await db.query('UPDATE notes SET body = body WHERE document_id = 1');
			await db.document.update({ title: 'Changed and still public' }, { where: x => x.id.eq(2) });
		});
	}
	return { open, asAdmin, requests, visibility, setRowFault: value => { rowFault = value; }, setPushFault: value => { pushFault = value; } };
}

for (const dual of [false, true]) describe(dual ? 'dual replica visibility' : 'single replica visibility', () => {
	test.each([true, false])('withdraws unavailable rows and dependent children, retaining the owner copy (RLS=%s)', async rls => {
		const f = await fixture(dual, rls), viewer = f.open(), owner = f.open(2);
		await viewer.db.syncClient.sync();
		await owner.db.syncClient.sync();
		expect((await viewer.db.document.getMany()).map(x => x.id).sort()).toEqual([1, 2, 4]);
		expect(await viewer.db.note.getById(10)).toBeDefined();
		f.requests.length = 0;
		await f.visibility(false);
		await viewer.db.syncClient.sync();
		// Every processed key is read once, including holes before truncation.
		expect(f.requests.filter(r => r.phase === 'rows').map(r => `${r.items[0].table}:${r.items[0].pk[0]}`).sort())
			.toEqual(['document:1', 'document:2', 'note:10']);
		await owner.db.syncClient.sync();
		expect(await viewer.db.document.getById(1)).toBeUndefined();
		expect(await viewer.db.note.getById(10)).toBeUndefined();
		expect((await viewer.db.document.getById(2)).title).toBe('Changed and still public');
		expect(await owner.db.document.getById(1)).toMatchObject({ isPublic: false });
		expect(await owner.db.note.getById(10)).toBeDefined();
		// The client asks for more than the server limit; deferred keys survive.
		expect(f.requests.some(r => r.phase === 'rows' && r.items.length > 1)).toBe(true);
		expect(f.requests.filter(r => r.phase === 'push')).toEqual([]);
		await viewer.close();
		const reopened = f.open();
		expect(await reopened.db.document.getById(1)).toBeUndefined();
		await reopened.db.syncClient.sync();
		expect(await reopened.db.document.getById(1)).toBeUndefined();
		expect(f.requests.filter(r => r.phase === 'push')).toEqual([]);
		await f.visibility(true);
		await reopened.db.syncClient.sync();
		expect(await reopened.db.document.getById(1)).toMatchObject({ isPublic: true });
		expect(await reopened.db.note.getById(10)).toBeDefined();
	}, 30000);

	test('retains cached rows after failed or malformed row responses and retries after reopening', async () => {
		const f = await fixture(dual), viewer = f.open();
		await viewer.db.syncClient.sync();
		await f.visibility(false);
		for (const fault of [503, 'malformed']) {
			f.setRowFault(fault);
			await expect(viewer.db.syncClient.sync()).rejects.toBeDefined();
			expect(await viewer.db.document.getById(1)).toMatchObject({ isPublic: true });
			expect(await viewer.db.note.getById(10)).toBeDefined();
		}
		await viewer.close();
		f.setRowFault(null);
		const reopened = f.open();
		await reopened.db.syncClient.sync();
		expect(await reopened.db.document.getById(1)).toBeUndefined();
		expect(await reopened.db.note.getById(10)).toBeUndefined();
	}, 30000);

	test('preserves pending writes on push failure and withdraws inaccessible rows after publication succeeds', async () => {
		const f = await fixture(dual), viewer = f.open();
		await viewer.db.syncClient.sync();
		const own = await viewer.db.document.getById(4);
		own.title = 'Offline edit';
		await own.saveChanges();
		await f.visibility(false);
		f.setPushFault(true);
		await expect(viewer.db.syncClient.sync()).rejects.toBeDefined();
		expect((await viewer.db.document.getById(4)).title).toBe('Offline edit');
		expect(await viewer.db.document.getById(1)).toBeDefined();
		await viewer.close();
		f.setPushFault(false);
		const reopened = f.open();
		await reopened.db.syncClient.sync();
		expect(await reopened.db.document.getById(1)).toBeUndefined();
		expect((await reopened.db.document.getById(4)).title).toBe('Offline edit');
		expect((await f.asAdmin(db => db.document.getById(4))).title).toBe('Offline edit');
		expect(await f.asAdmin(db => db.document.getById(1))).toBeDefined();
	}, 30000);
});
