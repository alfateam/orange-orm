import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const fs = require('fs');
const rdb = require('../src/index');

const sqliteName = `demo.sqlite.generatedPrimaryKey.${process.pid}.db`;
const map = rdb.map((x) => ({
	generatedUuid: x.table('generatedUuid').map(({ column }) => ({
		id: column('id').uuid().primary().notNullExceptInsert(),
		name: column('name').string()
	})),
	generatedComposite: x.table('generatedComposite').map(({ column }) => ({
		namespace: column('namespace').string().primary().notNullExceptInsert(),
		sequence: column('sequence').numeric().primary().notNullExceptInsert(),
		name: column('name').string()
	}))
}));
const db = map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) });

beforeAll(async () => {
	fs.rmSync(sqliteName, { force: true });
	await db.query([
		'CREATE TABLE generatedUuid (',
		' id TEXT PRIMARY KEY NOT NULL DEFAULT (',
		'  lower(hex(randomblob(4))) || \'-\' || lower(hex(randomblob(2))) || \'-\' ||',
		'  \'4\' || substr(lower(hex(randomblob(2))), 2) || \'-\' ||',
		'  substr(\'89ab\', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || \'-\' ||',
		'  lower(hex(randomblob(6)))',
		' ),',
		' name TEXT',
		')'
	].join('\n'));
	await db.query([
		'CREATE TABLE generatedComposite (',
		' namespace TEXT NOT NULL DEFAULT (\'db\'),',
		' sequence INTEGER NOT NULL DEFAULT (abs(random()) % 1000000000),',
		' name TEXT,',
		' PRIMARY KEY (namespace, sequence)',
		')'
	].join('\n'));
});

afterAll(async () => {
	await db.close();
	fs.rmSync(sqliteName, { force: true });
});

describe('sqlite database-generated primary keys', () => {
	test('reads a database-generated UUID after insert', async () => {
		const inserted = await db.generatedUuid.insert({ name: 'Uuid' });
		const selected = await db.generatedUuid.getById(inserted.id);

		expect(inserted.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(selected.name).toBe('Uuid');
	});

	test('reads every component of a database-generated composite key', async () => {
		const inserted = await db.generatedComposite.insert({ name: 'Composite' });
		const selected = await db.generatedComposite.getById(inserted.namespace, inserted.sequence);

		expect(inserted.namespace).toBe('db');
		expect(Number.isInteger(inserted.sequence)).toBe(true);
		expect(selected.name).toBe('Composite');
	});
});
