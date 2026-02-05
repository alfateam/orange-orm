import { describe, test, beforeAll, afterAll, expect, expectTypeOf } from 'vitest';
import rdb from '../src/index.js';

const sqliteName = 'demo.enum.test.db';
enum Country {
	sweden = 'se',
	norway = 'no',
}
const values = ['active', 'foobar'] as const;
const Countries = {
  NORWAY: 'NO',
  SWEDEN: 'SE',
  DENMARK: 'DK',
  FINLAND: 'FI',
  ICELAND: 'IS',
  GERMANY: 'DE',
  FRANCE: 'FR',
  NETHERLANDS: 'NL',
  SPAIN: 'ES',
  ITALY: 'IT',
} as const;

const map = rdb.map(x => ({
	enumTest: x.table('enumTest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		status: column('status').string().enum(['ACTIVE', 'INACTIVE']),
		status2: column('status').string().enum(Country),
		status3: column('status').string().enum(values),
		//dont need this
		status4: column('status').string().enum(Countries),
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

describe('enum', () => {
	test('allows values in the enum list', async () => {
		const row = await db.enumTest.insert({ status: 'ACTIVE' });

		row.status
		row.status2 = Country.norway;
		row.status3
		row.status4
		expect(row.status).toBe('ACTIVE');
		expectTypeOf(row.status).toEqualTypeOf<'ACTIVE' | 'INACTIVE'>();
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
