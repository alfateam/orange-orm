import { afterAll, beforeAll, expect, test } from 'vitest';
import { isProxy } from 'node:util/types';

const orange = require('../src/index');
const newSyncHandler = require('../src/hostExpress/sync');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const map = orange.map(x => ({
	document: x.table('documents').map(({ column }) => ({
		id: column('id').numeric().primary(),
		payload: column('payload').json(),
		created: column('created').dateWithTimeZone(),
		internal: column('internal').string().serializable(false)
	}))
}));
const db = map.pglite(undefined, { size: 1 });

beforeAll(async () => {
	await db.query('CREATE TABLE documents (id integer PRIMARY KEY, payload jsonb, created timestamptz, internal text)');
	await setupChangeTracking(db, db.tables);
	await db.document.insert([
		{ id: 1, payload: { list: [{ text: 'Été "quoted"', value: null }], flag: false }, created: '2026-11-05T10:00:00Z', internal: 'retained in sync' },
		{ id: 2, payload: null, created: null, internal: null }
	]);
}, 30000);
afterAll(() => db.close());

test('snapshot pages preserve row JSON without editable proxies', async () => {
	const handle = newSyncHandler(db, { document: {}, sync: {} });
	const expected = await db.document.getMany(undefined, { orderBy: 'id' });
	// Compare individual rows, as the snapshot protocol serializes them.
	const expectedJson = expected.map(row => JSON.stringify(row));
	let token;
	const actual = [];
	do {
		let result;
		await handle({ body: { phase: 'keys', tables: ['document'], inlineRows: true, limit: 1, token } }, {
			json(value) { result = value; },
			status(code) { throw new Error(`Unexpected HTTP ${code}`); }
		});
		for (const item of result.items) {
			expect(isProxy(item.row)).toBe(false);
			if (item.row.payload) {
				expect(isProxy(item.row.payload)).toBe(false);
				expect(isProxy(item.row.payload.list[0])).toBe(false);
			}
			actual.push(JSON.stringify(item.row));
		}
		token = result.token;
	} while (token);
	expect(actual).toEqual(expectedJson);
	expect(JSON.parse(actual[0]).internal).toBe('retained in sync');
	// Ordinary ORM reads still track nested JSON changes for saves.
	expected[0].payload.list[0].text = 'Changed';
	await expected.saveChanges();
	expect((await db.document.getById(1)).payload.list[0].text).toBe('Changed');
});
