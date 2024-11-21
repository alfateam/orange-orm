import { describe, test, beforeAll, expect } from 'vitest';
const map = require('./db');

const initPg = require('./initPg');

beforeAll(async () => {
	await insertData('pg');

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);
	}
});

describe('search path custom', () => {
	test('pgWithSchema', async () => await verify('pgWithSchema'));

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
	pgWithSchema: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres?search_path=custom', { size: 1 }) }),
	}
};

function getDb(name) {
	if (name === 'pg')
		return connections.pg;
	if (name === 'pgWithSchema')
		return connections.pgWithSchema;
	else
		throw new Error('unknown');
}
