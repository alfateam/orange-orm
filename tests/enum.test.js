import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const rdb = require('../src/index');

const sqliteName = 'demo.enum.test.js.db';
const Values = Object.freeze({ active: 'ACTIVE', inactive: 'INACTIVE' });

const map = rdb.map(x => ({
	enumTest: x.table('enumTest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		status: column('status').string().enum(['ACTIVE', 'INACTIVE']),
		status2: column('status2').string().enum(Values),
		status3: column('status3').string().enum({ active: 'ACTIVE', inactive: 'INACTIVE' }),
	}))
}));

const db = map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) });

beforeAll(async () => {
	const sql = [
		'DROP TABLE IF EXISTS enumTest',
		'CREATE TABLE enumTest (id INTEGER PRIMARY KEY, status TEXT,status2 TEXT,status3 TEXT)'
	];
	for (const statement of sql) {
		await db.query(statement);
	}
});

afterAll(async () => {
	await db.close();
});

const enumCases = [
	{ column: 'status', valid: 'ACTIVE', invalid: 'BROKEN', allowed: ['ACTIVE', 'INACTIVE'] },
	{ column: 'status2', valid: Values.active, invalid: 'BROKEN', allowed: Object.values(Values) },
	{ column: 'status3', valid: 'ACTIVE', invalid: 'BROKEN', allowed: ['ACTIVE', 'INACTIVE'] },
];

describe('enum (js)', () => {
	for (const { column, valid } of enumCases) {
		test(`allows values in the enum list for ${column}`, async () => {
			const row = await db.enumTest.insert({ [column]: valid });
			expect(row[column]).toBe(valid);
		});
	}

	for (const { column, invalid, allowed } of enumCases) {
		const expected = `Column ${column} must be one of: ${allowed.map((v) => JSON.stringify(v)).join(', ')}`;
		test(`rejects values outside the enum list on insert for ${column}`, async () => {
			await expect(db.enumTest.insert({ [column]: invalid }))
				.rejects
				.toThrow(expected);
		});
	}

	for (const { column, valid, invalid, allowed } of enumCases) {
		const expected = `Column ${column} must be one of: ${allowed.map((v) => JSON.stringify(v)).join(', ')}`;
		test(`rejects values outside the enum list on update for ${column}`, async () => {
			const row = await db.enumTest.insert({ [column]: valid });
			row[column] = invalid;
			await expect(row.saveChanges())
				.rejects
				.toThrow(expected);
		});
	}
});
