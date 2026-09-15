import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

const express = require('express');
const orange = require('../src/index');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const map = orange.map(x => ({
	document: x.table('documents').map(({ column }) => ({
		id: column('id').numeric().primary(),
		ownerId: column('owner_id').numeric(),
		isPublic: column('is_public').boolean(),
		title: column('title').string()
	})),
	note: x.table('notes').map(({ column }) => ({
		id: column('id').numeric().primary(),
		documentId: column('document_id').numeric(),
		ownerId: column('owner_id').numeric(),
		title: column('title').string()
	})),
	part: x.table('parts').map(({ column }) => ({
		documentId: column('document_id').numeric().primary(),
		code: column('code').string().primary(),
		ownerId: column('owner_id').numeric()
	}))
})).map(x => ({
	document: x.document.map(({ hasMany }) => ({ notes: hasMany(x.note).by('documentId') }))
}));
const db = map.pglite(undefined, { size: 1 });
let server;
let url;

beforeAll(async () => {
	await db.query('CREATE TABLE documents (id SERIAL PRIMARY KEY, owner_id INTEGER, is_public BOOLEAN, title TEXT)');
	await db.query('CREATE TABLE notes (id INTEGER PRIMARY KEY, document_id INTEGER REFERENCES documents(id), owner_id INTEGER, title TEXT)');
	await db.query('CREATE TABLE parts (document_id INTEGER, code TEXT, owner_id INTEGER, PRIMARY KEY (document_id, code))');
	await setupChangeTracking(db, db.tables);
	const app = express().use(express.json());
	const ownerFilter = table => async (tx, req, res) => {
		expect(res.locals.transactionStarted).toBe(true);
		const [{ owner }] = await tx.query({ sql: 'SELECT ?::integer AS owner', parameters: [Number(req.headers['x-owner'] || 1)] });
		return tx[table].ownerId.eq(owner);
	};
	const hooks = { afterBegin: (_tx, _req, res) => { res.locals.transactionStarted = true; } };
	app.use('/owner', db.express({
		document: { baseFilter: ownerFilter('document') },
		note: { baseFilter: ownerFilter('note') }, hooks
	}));
	app.use('/public', db.express({
		document: { baseFilter: (tx, req) => tx.or(tx.document.isPublic.eq(true), tx.document.ownerId.eq(Number(req.headers['x-owner'] || 1))) }
	}));
	app.use('/static', db.express({ document: { baseFilter: { sql: 'owner_id = ?', parameters: [1] } } }));
	app.use('/inherited', db({ document: { baseFilter: ownerFilter('document') } }).express({ hooks }));
	app.use('/compound', db.express({ part: { baseFilter: ownerFilter('part') }, hooks }));
	app.use('/denied', db.express({ document: { baseFilter: async () => {
		throw Object.assign(new Error('Denied'), { status: 403 });
	} } }));
	await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
	url = `http://127.0.0.1:${server.address().port}`;
}, 30000);

beforeEach(async () => {
	await db.query('TRUNCATE documents, notes, parts, orange_changes, orange_sync_applied_mutations RESTART IDENTITY CASCADE');
	await db.query('ALTER SEQUENCE documents_id_seq RESTART WITH 100');
	await db.document.insert([
		{ id: 1, ownerId: 1, isPublic: false, title: 'Mine' },
		{ id: 2, ownerId: 2, isPublic: true, title: 'Public' },
		{ id: 3, ownerId: 2, isPublic: false, title: 'Private' },
		{ id: 4, ownerId: 1, isPublic: false, title: 'Mine too' }
	]);
	await db.note.insert([
		{ id: 10, documentId: 1, ownerId: 1, title: 'My note' },
		{ id: 20, documentId: 1, ownerId: 2, title: 'Their note' },
		{ id: 30, documentId: 3, ownerId: 2, title: 'Private note' }
	]);
	await db.part.insert([
		{ documentId: 1, code: 'a', ownerId: 1 },
		{ documentId: 1, code: 'b', ownerId: 2 },
		{ documentId: 2, code: 'a', ownerId: 2 }
	]);
});

afterAll(async () => {
	if (server)
		await new Promise(resolve => server.close(resolve));
	await db.close();
});

describe('sync row reads enforce baseFilter', () => {
	test.each(['/owner', '/static', '/inherited'])('filters inline snapshot rows at %s', async endpoint => {
		const first = await request(endpoint, { phase: 'keys', tables: ['document'], inlineRows: true, limit: 1 });
		expect(first.status).toBe(200);
		expect(first.body.items.map(x => x.row.id)).toEqual([1]);
		const next = await request(endpoint, { phase: 'keys', tables: ['document'], token: first.body.token, limit: 1 });
		expect(next.status).toBe(200);
		expect(next.body.items.map(x => x.row.id)).toEqual([4]);
	});

	test('allows public data and only the current owner’s private data', async () => {
		const result = await request('/public', { phase: 'keys', inlineRows: true });
		expect(result.body.items.map(x => x.row.id)).toEqual([1, 2, 4]);
		const other = await request('/public', { phase: 'keys', inlineRows: true }, 2);
		expect(other.body.items.map(x => x.row.id)).toEqual([2, 3]);
	});

	test('rechecks arbitrary keys and ignores client filter overrides', async () => {
		const result = await request('/owner', {
			phase: 'rows', options: { baseFilter: null },
			items: [{ table: 'document', pk: [1] }, { table: 'document', pk: [3] }, { table: 'note', pk: [20] }]
		});
		expect(result.status).toBe(200);
		expect(result.body.items.map(x => x.row.title)).toEqual(['Mine']);
	});

	test('does not require baseFilter for snapshot keys without inline data', async () => {
		const result = await request('/owner', { phase: 'keys', tables: ['document'] });
		expect(result.body.items.map(x => x.pk)).toEqual([[1], [2], [3], [4]]);
		expect(result.body.items.every(x => !('row' in x))).toBe(true);
	});

	test('re-evaluates request identity for snapshot continuation tokens', async () => {
		const first = await request('/owner', { phase: 'keys', tables: ['document'], inlineRows: true, limit: 1 });
		const other = await request('/owner', { phase: 'keys', tables: ['document'], token: first.body.token }, 2);
		expect(other.body.items.map(x => x.row.id)).toEqual([2, 3]);
	});

	test('combines all components of composite keys with the filter', async () => {
		const result = await request('/compound', { phase: 'rows', items: [
			{ table: 'part', pk: [1, 'a'] }, { table: 'part', key: { documentId: 1, code: 'b' } },
			{ table: 'part', pk: [2, 'a'] }
		] });
		expect(result.status).toBe(200);
		expect(result.body.items.map(x => x.pk)).toEqual([[1, 'a']]);
	});

	test.each([
		{ phase: 'keys', inlineRows: true },
		{ phase: 'rows', items: [{ table: 'document', pk: [1] }] }
	])('does not return data when an async filter rejects a %j request', async body => {
		expect(await request('/denied', body)).toEqual({ status: 403, body: 'Denied' });
	});

	test('keeps change-log keys unfiltered, including deletes, but filters fetched rows', async () => {
		await db.note.delete(db.note.documentId.eq(3));
		await db.document.delete(db.document.id.eq(3));
		const [{ max }] = await db.query('SELECT MAX(id) AS max FROM orange_changes');
		const keys = await request('/owner', {
			phase: 'keys', tables: ['document'], token: { v: 1, mode: 'changes', cursor: 0, watermark: Number(max) }
		});
		expect(keys.status).toBe(200);
		expect(keys.body.items).toEqual(expect.arrayContaining([
			expect.objectContaining({ pk: [2], op: 'I' }), expect.objectContaining({ pk: [3], op: 'D' })
		]));
		const rows = await request('/owner', { phase: 'rows', items: keys.body.items });
		expect(rows.body.items.map(x => x.row.id)).toEqual([1, 4]);
	});

	test('syncs only permitted rows into SQLite through snapshots and incremental changes', async () => {
		const local = map.sqlite(':memory:', { size: 1, sync: {
			url: `${url}/public`, tables: ['document'], auto: false,
			pull: { maxKeysPerBatch: 2, maxRowsPerBatch: 2 }
		} });
		try {
			await local.syncClient.sync();
			expect((await local.document.getMany()).map(row => row.id).sort()).toEqual([1, 2, 4]);
			await db.document.update({ title: 'Updated' }, { where: x => x.id.eq(1) });
			await db.document.update({ title: 'Still private' }, { where: x => x.id.eq(3) });
			await local.syncClient.sync();
			expect((await local.document.getById(1)).title).toBe('Updated');
			expect(await local.document.getById(3)).toBeUndefined();
		}
		finally {
			await local.close();
		}
	});
});

async function request(endpoint, body, owner = 1) {
	const response = await fetch(`${url}${endpoint}?sync=pull`, {
		method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': String(owner) }, body: JSON.stringify(body)
	});
	const text = await response.text();
	return { status: response.status, body: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text };
}
