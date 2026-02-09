import { describe, test, beforeAll, afterAll, expect, expectTypeOf } from 'vitest';
import rdb from '../src/index.js';

const sqliteName = 'demo.enum.test.db';
enum ValueEnum {
	active = 'ACTIVE',
	inactive = 'INACTIVE',
}
const statuses = ['ACTIVE', 'INACTIVE'] as const;
const values = ['ACTIVE', 'INACTIVE'] as const;
const Values = {
	active: 'ACTIVE',
	inactive: 'INACTIVE'
} as const;

const map = rdb.map(x => ({
	enumTest: x.table('enumTest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		status: column('status').string().enum(statuses),
		status2: column('status2').string().enum(ValueEnum),
		status3: column('status3').string().enum(Values),
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
	{ column: 'status', valid: statuses[0], invalid: 'BROKEN', allowed: [...statuses] },
	{ column: 'status2', valid: ValueEnum.active, invalid: 'BROKEN', allowed: Object.values(ValueEnum) },
	{ column: 'status3', valid: Values.active, invalid: 'BROKEN', allowed: Object.values(Values) },
] as const;

describe('enum', () => {
	
	for (const { column, valid } of enumCases) {
		test(`allows values in the enum list for ${column}`, async () => {
			const row = await db.enumTest.insert({ [column]: valid });
			expect((row as Record<string, unknown>)[column]).toBe(valid);
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
			(row as Record<string, unknown>)[column] = invalid;
			await expect(row.saveChanges())
				.rejects
				.toThrow(expected);
		});
	}
});
