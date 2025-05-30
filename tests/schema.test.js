import { describe, test, beforeAll, expect } from 'vitest';
const map = require('./db');

const initPg = require('./initPg');

beforeAll(async () => {
	await insertData('pg');
	await insertData('pglite');

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);
	}
});

describe('search path custom', () => {
	test('pgWithSchema', async () => await verify('pgWithSchema'));
	test('pgliteWithSchema', async () => await verify('pgliteWithSchema'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const customer = await db.withSchema.insert({
			name: 'Voldemort',
		});

		const expected = {
			id: 1,
			name: 'Voldemort',
		};

		expect(customer).toEqual(expected);
	}
});

const connections = {
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg
	},
	pglite: {
		db: map({ db: con => con.pglite( './pglite.db', { size: 1 }) }),
		init: initPg
	},
	pgWithSchema: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres?search_path=custom', { size: 1 }) }),
	},
	pgliteWithSchema: {
		db: map({ db: con => con.pglite('./pglite.db?search_path=custom', { size: 1 }) }),
	}
};

function getDb(name) {
	if (name === 'pg')
		return connections.pg;
	if (name === 'pglite')
		return connections.pglite;
	if (name === 'pgWithSchema')
		return connections.pgWithSchema;
	if (name === 'pgliteWithSchema')
		return connections.pgliteWithSchema;
	else
		throw new Error('unknown ' + name);
}
