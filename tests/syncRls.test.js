import { afterAll, beforeAll, expect, test } from 'vitest';

const express = require('express');
const orange = require('../src/index');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const map = orange.map(x => ({
	vote: x.table('private_votes').map(({ column }) => ({
		id: column('id').numeric().primary(),
		owner: column('owner_id').numeric(),
		stars: column('stars').numeric()
	}))
}));
const db = map.pglite(undefined, { size: 1 });
let server, url;

beforeAll(async () => {
	await db.query('CREATE TABLE private_votes (id integer PRIMARY KEY, owner_id integer NOT NULL, stars integer)');
	await setupChangeTracking(db, db.tables);
	await db.vote.insert([{ id: 1, owner: 1, stars: 4 }, { id: 2, owner: 2, stars: 2 }, { id: 3, owner: 1, stars: 5 }]);
	await db.query('CREATE ROLE sync_reader');
	await db.query('GRANT USAGE ON SCHEMA public TO sync_reader');
	await db.query('GRANT SELECT ON private_votes, orange_changes TO sync_reader');
	await db.query('ALTER TABLE private_votes ENABLE ROW LEVEL SECURITY');
	await db.query(`CREATE POLICY own_votes ON private_votes USING (owner_id::text = current_setting('test.owner', true))`);
	// Stay on the restricted role, like a deployed pool. Switching roles only
	// inside the hook would itself be lost by a transactionless read and let
	// the owner connection bypass RLS, hiding the missing-identity bug.
	await db.query('SET ROLE sync_reader');
	const app = express().use(express.json());
	app.use('/rdb', db.express({ vote: {}, sync: {}, hooks: { transaction: {
		afterBegin: async (tx, req) => {
			await tx.query({ sql: "SELECT set_config('test.owner', ?, true)", parameters: [req.get('X-Owner') || ''] });
		}
	} } }));
	await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
	url = `http://127.0.0.1:${server.address().port}/rdb?sync=1`;
}, 30000);

afterAll(async () => {
	if (server) await new Promise(resolve => server.close(resolve));
	await db.close();
});

async function request(body, owner) {
	const response = await fetch(url, { method: 'POST', headers: {
		'Content-Type': 'application/json', ...(owner ? { 'X-Owner': String(owner) } : {})
	}, body: JSON.stringify(body) });
	expect(response.status, await response.clone().text()).toBe(200);
	return response.json();
}

test.each([false, true])('snapshot reads retain transaction-local identity (inlineRows=%s)', async inlineRows => {
	for (const [owner, expected] of [[1, [1, 3]], [2, [2]], [undefined, []], [1, [1, 3]]]) {
		let token, items = [];
		do {
			const result = await request({ phase: 'keys', inlineRows, limit: 1, ...(token ? { token } : {}) }, owner);
			items.push(...result.items);
			token = result.token;
		} while (token);
		expect(items.map(item => item.pk[0])).toEqual(expected);
		if (inlineRows) expect(items.map(item => item.row.owner)).toEqual(expected.map(() => owner));
		// Identity must not leak into the next pool borrower.
		expect(await db.vote.getMany()).toEqual([]);
	}
});

test('row reads retain identity and do not leak another account or a previous request', async () => {
	const items = [1, 2, 3].map(id => ({ table: 'vote', pk: [id], op: 'U' }));
	for (const [owner, expected] of [[1, [1, 3]], [2, [2]], [undefined, []]]) {
		const result = await request({ phase: 'rows', items }, owner);
		expect(result.items.map(item => item.row.id)).toEqual(expected);
		expect(await db.vote.getMany()).toEqual([]);
	}
});
