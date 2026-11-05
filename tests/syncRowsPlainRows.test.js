import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { isProxy } from 'node:util/types';

const orange = require('../src/index');
const newSyncHandler = require('../src/hostExpress/sync');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const map = orange.map(x => ({
	document: x.table('documents').map(({ column }) => ({
		id: column('id').numeric().primary(),
		language: column('language').string().primary(),
		owner: column('owner_id').numeric(),
		payload: column('payload').json(),
		created: column('created').dateWithTimeZone(),
		internal: column('internal').string().serializable(false)
	}))
}));
const db = map.pglite(undefined, { size: 1 });
beforeAll(async () => {
	await db.query('CREATE TABLE documents (id integer, language text, owner_id integer, payload jsonb, created timestamptz, internal text, PRIMARY KEY (id, language))');
	await setupChangeTracking(db, db.tables);
}, 30000);
beforeEach(async () => {
	await db.query('TRUNCATE documents, orange_changes, orange_sync_applied_mutations RESTART IDENTITY');
	await db.document.insert([
		{ id: 1, language: 'fr', owner: 1, payload: { list: [{ text: 'Été', value: null }] }, created: '2026-11-05T10:00:00Z', internal: 'sync value' },
		{ id: 1, language: 'en', owner: 2, payload: { list: [] }, created: null, internal: null },
		{ id: 2, language: 'fr', owner: 1, payload: null, created: null, internal: null }
	]);
});
afterAll(() => db.close());

test.each([false, true])('incremental rows preserve wire data and compound keys without proxies (baseFilter=%s)', async filtered => {
	const handle = newSyncHandler(db, { document: filtered
		? { baseFilter: (tx, req) => tx.document.owner.eq(req.owner) } : {}, sync: {} });
	async function request(body) {
		let result;
		await handle({ body, owner: 1 }, {
			json(value) { result = value; },
			status(code) { throw new Error(`Unexpected HTTP ${code}`); }
		});
		return result;
	}
	const initial = await request({ phase: 'keys', inlineRows: true });
	await db.query({ sql: 'UPDATE documents SET payload = ?::jsonb WHERE id = 1',
		parameters: [JSON.stringify({ list: [{ text: 'Changed', value: null }] })] });
	await db.query('DELETE FROM documents WHERE id = 2');
	const changes = await request({ phase: 'keys', cursor: initial.cursor });
	expect(changes.mode).toBe('changes');
	expect(changes.items).toEqual(expect.arrayContaining([
		expect.objectContaining({ pk: [2, 'fr'], op: 'D' })
	]));
	const missing = { table: 'document', pk: [999, 'fr'], op: 'U' };
	const rows = await request({ phase: 'rows', items: [...changes.items, missing] });
	const expected = await db.document.getMany(filtered ? db.document.owner.eq(1) : undefined);
	expect(rows.items.map(item => item.pk).sort()).toEqual(expected.map(row => [row.id, row.language]).sort());
	for (const item of rows.items) {
		const original = expected.find(row => row.id === item.pk[0] && row.language === item.pk[1]);
		expect(JSON.stringify(item.row)).toBe(JSON.stringify(original));
		expect(isProxy(item.row)).toBe(false);
		expect(isProxy(item.row.payload)).toBe(false);
		expect(isProxy(item.row.payload.list[0])).toBe(false);
	}
	expect(await request({ phase: 'rows', items: [missing] })).toMatchObject({ items: [] });
	expect(await request({ phase: 'rows', items: [] })).toMatchObject({ items: [] });
	// Restrict the tuple, not merely its numeric component.
	const single = await request({ phase: 'rows', items: [{ table: 'document', pk: [1, 'fr'], op: 'U' }] });
	expect(single.items.map(item => item.pk)).toEqual([[1, 'fr']]);
});
