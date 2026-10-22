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
	document: x.document.map(({ hasMany }) => ({ notes: hasMany(x.note).by('documentId') })),
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
		if (req.body.phase === 'row' && rowFault) {
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


for (const dual of [false, true]) describe(dual ? 'dual replica syncById' : 'single replica syncById', () => {
	test.each([true, false])('reconciles full collections, including moved rows (RLS=%s)', async rls => {
		const f = await fixture(dual, rls), { db } = f.open();
		await db.syncClient.sync();
		const checkpoint = await db.query('SELECT * FROM orange_sync_state');
		await f.asAdmin(async remote => {
			await remote.note.update({ documentId: 2, body: 'Moved' }, { where: x => x.id.eq(10) });
			await remote.note.insert({ id: 11, documentId: 1, body: 'New' });
			await remote.document.update({ title: 'Updated' }, { where: x => x.id.eq(1) });
			await remote.document.update({ title: 'Unselected' }, { where: x => x.id.eq(2) });
		});
		f.requests.length = 0;
		await db.document.syncById(1, { title: false, notes: { body: true, orderBy: 'id' } });
		expect(await db.document.getById(1)).toMatchObject({ title: 'Updated' });
		expect(await db.document.getById(2)).toMatchObject({ title: 'Still public' });
		expect(await db.note.getById(10)).toMatchObject({ documentId: 2, body: 'Moved' });
		expect(await db.note.getById(11)).toMatchObject({ documentId: 1, body: 'New' });
		expect(f.requests.map(r => r.phase)).toEqual(['row']);
		expect((await db.query('SELECT * FROM orange_sync_state')).map(row => [row.scope, JSON.parse(row.since_value).since]))
			.toEqual(checkpoint.map(row => [row.scope, JSON.parse(row.since_value).since]));
		await f.asAdmin(remote => remote.note.delete(remote.note.id.eq(11)));
		await db.document.syncById(1, { notes: true });
		expect(await db.note.getById(11)).toBeUndefined();
		expect(await db.note.getById(10)).toBeDefined();
		await db.syncClient.sync();
		expect(await db.document.getById(2)).toMatchObject({ title: 'Unselected' });
		expect(await db.note.getById(10)).toMatchObject({ documentId: 2 });
	}, 30000);

	test('rejects partial strategies and retains cache after incomplete or failed responses', async () => {
		const f = await fixture(dual), { db } = f.open();
		await db.syncClient.sync();
		for (const strategy of [{ limit: 1 }, { notes: { where: {} } }, { notes: { offset: 1 } }])
			await expect(db.document.syncById(1, strategy)).rejects.toThrow('cannot restrict');
		await f.asAdmin(remote => remote.note.delete(remote.note.id.eq(10)));
		for (const fault of ['malformed', 503]) {
			f.setRowFault(fault);
			await expect(db.document.syncById(1, { notes: true })).rejects.toThrow();
			expect(await db.note.getById(10)).toBeDefined();
		}
		f.setRowFault(undefined);
		await db.document.syncById(1, { notes: true });
		expect(await db.note.getById(10)).toBeUndefined();
	}, 30000);

	test('keeps local writes made during the request and reports deferral', async () => {
		const f = await fixture(dual), { db } = f.open();
		await db.syncClient.sync();
		let wrote = false;
		db.syncClient.interceptors.request.use(async config => {
			if (!wrote && config.data?.phase === 'row') {
				wrote = true;
				const row = await db.document.getById(4);
				row.title = 'Local edit';
				await row.saveChanges();
			}
			return config;
		});
		const result = await db.document.syncById(4);
		expect(result).toMatchObject({ applied: 0, deferred: 'pending-writes' });
		expect(await db.document.getById(4)).toMatchObject({ title: 'Local edit' });
		await db.document.syncById(4);
		expect(await db.document.getById(4)).toMatchObject({ title: 'Local edit' });
	}, 30000);

	test('reconciles nested collections through references and survives reopening', async () => {
		const f = await fixture(dual), opened = f.open(), { db } = opened;
		await f.asAdmin(remote => remote.note.insert({ id: 11, documentId: 1, body: 'Sibling' }));
		await db.syncClient.sync();
		await f.asAdmin(remote => remote.note.delete(remote.note.id.eq(11)));
		await db.note.syncById(10, { document: { notes: true } });
		expect(await db.note.getById(11)).toBeUndefined();
		await opened.close();
		const reopened = f.open();
		expect(await reopened.db.note.getById(11)).toBeUndefined();
		await reopened.db.document.syncById(2);
		expect(await reopened.db.note.getById(11)).toBeUndefined();
	}, 30000);

	test('orders FK dependencies, handles reparenting during deletion, and rolls back incomplete graphs', async () => {
		const f = await fixture(dual), { db } = f.open();
		await db.syncClient.sync();
		await f.asAdmin(async remote => {
			await remote.document.insert({ id: 5, owner: 1, isPublic: true, title: 'New parent' });
			await remote.note.insert({ id: 50, documentId: 5, body: 'New child' });
		});
		// The graph starts at the child, but its new parent must be inserted first.
		await db.note.syncById(50, { document: true });
		expect(await db.note.getById(50)).toMatchObject({ documentId: 5 });
		await f.asAdmin(async remote => {
			await remote.note.update({ documentId: 2 }, { where: x => x.id.eq(10) });
			await remote.document.delete(remote.document.id.eq(1));
		});
		// Deleting the old parent must not delete the child that moved away.
		await db.document.syncById(1, { notes: true });
		expect(await db.document.getById(1)).toBeUndefined();
		expect(await db.note.getById(10)).toMatchObject({ documentId: 2 });
		await f.asAdmin(async remote => {
			await remote.note.delete(remote.note.id.eq(50));
			await remote.document.delete(remote.document.id.eq(5));
		});
		await db.document.syncById(5, { notes: true });
		expect(await db.note.getById(50)).toBeUndefined();
		expect(await db.document.getById(5)).toBeUndefined();
		await f.asAdmin(async remote => {
			await remote.document.insert({ id: 6, owner: 1, isPublic: true, title: 'Uncached parent' });
			await remote.note.insert({ id: 60, documentId: 6, body: 'Requires parent' });
		});
		await expect(db.note.syncById(60)).rejects.toThrow(/foreign key/i);
		expect(await db.note.getById(60)).toBeUndefined();
		await db.note.syncById(60, { document: true });
		expect(await db.note.getById(60)).toMatchObject({ documentId: 6 });
		expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
	}, 30000);

	test('withdraws rows that are no longer visible', async () => {
		const f = await fixture(dual), { db } = f.open();
		await db.syncClient.sync();
		await f.visibility(false);
		await db.document.syncById(1, { notes: true });
		expect(await db.document.getById(1)).toBeUndefined();
		expect(await db.note.getById(10)).toBeUndefined();
	}, 30000);
});

test('does not expose syncById on a database without sync', async () => {
	const db = map.sqlite(':memory:');
	try { expect(db.document.syncById).toBeUndefined(); }
	finally { await db.close(); }
});
