import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const rdb = require('../src/index');

const sqliteName = 'demo.enum.test.js.db';

// const values = Object.freeze(['active', 'foobar']);
// const values2 = {foo: 'active', bar: 'inactive'};
const values2 = Object.freeze({foo: 'active', bar: 'inactive'});



const map = rdb.map(x => ({
	enumTest: x.table('enumTest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		status: column('status').string().enum(['ACTIVE', 'INACTIVE']),
		status2: column('status2').string().enum({foo: 'active', bar: 'inactive'}),
		status3: column('status2').string().enum(values2),
		orderId: column('orderId').numeric(),
		name: column('name').string(),
		street: column('street').string(),
		postalCode: column('postalCode').string(),
		postalPlace: column('postalPlace').string(),
		countryCode: column('countryCode').string(),

	}))
}));

const db = map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) });

beforeAll(async () => {
	const sql = [
		'DROP TABLE IF EXISTS enumTest',
		'CREATE TABLE enumTest (id INTEGER PRIMARY KEY, status TEXT)'
	];
	for (const statement of sql) {
		await db.query(statement);
	}
});

afterAll(async () => {
	await db.close();
});

describe('enum (js)', () => {
	test('allows values in the enum list', async () => {
		const row = await db.enumTest.insert({ status: 'ACTIVE' });
		row.status;
		row.status2;
		row.status3;
		expect(row.status).toBe('ACTIVE');
	});

	test('rejects values outside the enum list on insert', async () => {
		await expect(db.enumTest.insert({ status: 'BROKEN' }))
			.rejects
			.toThrow('Column status must be one of: \"ACTIVE\", \"INACTIVE\"');
	});

	test('rejects values outside the enum list on update', async () => {
		const row = await db.enumTest.insert({ status: 'INACTIVE' });
		row.status = 'BROKEN';
		await expect(row.saveChanges())
			.rejects
			.toThrow('Column status must be one of: \"ACTIVE\", \"INACTIVE\"');
	});
});
