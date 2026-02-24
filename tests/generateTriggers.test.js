import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import rdb from '../src/index';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

const tmpRoot = path.join(process.cwd(), 'tests', '.tmp', `generate-triggers-${Date.now()}-${process.pid}`);
const dbTsPath = path.join(tmpRoot, 'db.ts');
const schemaName = `trigger_cli_${Date.now()}_${process.pid}`;
const connectionString = 'postgres://postgres:postgres@postgres/postgres';
const schemaConnectionString = `${connectionString}?search_path=${schemaName}`;

const map = rdb.map(x => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string(),
	}))
}));

beforeAll(async () => {
	fs.mkdirSync(tmpRoot, { recursive: true });
	fs.writeFileSync(dbTsPath, newDbTsContent(), 'utf8');

	const db = newDb(connectionString);
	try {
		await db.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
		await db.query(`CREATE SCHEMA "${schemaName}";`);
		await db.query(`CREATE TABLE "${schemaName}".customer (id SERIAL PRIMARY KEY, name TEXT);`);
		await db.query([
			`CREATE TABLE "${schemaName}".orange_changes (`,
			'\tid BIGSERIAL PRIMARY KEY,',
			'\ttable_name TEXT NOT NULL,',
			'\top CHAR(1) NOT NULL,',
			'\tpk_json TEXT NOT NULL,',
			'\tts TIMESTAMPTZ NOT NULL DEFAULT NOW()',
			');'
		].join('\n'));
	} finally {
		await db.close();
	}

	runGenerateTriggers();
}, 60000);

afterAll(async () => {
	const db = newDb(connectionString);
	try {
		await db.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
	} finally {
		await db.close();
	}
	fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('generate-triggers cli', () => {
	test('writes rows to orange_changes for insert, update and delete', async () => {
		const db = newDb();
		try {
			await db.query('INSERT INTO customer (name) VALUES (\'Alice\');');
			await db.query('UPDATE customer SET name = \'Alice updated\' WHERE id = 1;');
			await db.query('DELETE FROM customer WHERE id = 1;');

			const result = await db.query('SELECT table_name, op, pk_json FROM orange_changes ORDER BY id;');
			const rows = Array.isArray(result) ? result : result.rows;

			expect(rows).toHaveLength(3);
			expect(rows.map(x => x.op)).toEqual(['I', 'U', 'D']);
			expect(rows.map(x => x.table_name)).toEqual(['customer', 'customer', 'customer']);
			expect(rows.map(x => JSON.parse(x.pk_json).id)).toEqual([1, 1, 1]);
		} finally {
			await db.close();
		}
	}, 20000);
});

function newDbTsContent() {
	return [
		'// @ts-nocheck',
		`const rdb = require(${JSON.stringify(path.join(process.cwd(), 'src', 'index.js'))});`,
		'const map = rdb.map(x => ({',
		'\tcustomer: x.table(\'customer\').map(({ column }) => ({',
		'\t\tid: column(\'id\').numeric().primary().notNullExceptInsert(),',
		'\t\tname: column(\'name\').string(),',
		'\t}))',
		'}));',
		`const db = map({ db: con => con.postgres(${JSON.stringify(schemaConnectionString)}, { size: 1 }) });`,
		'module.exports = db;',
		''
	].join('\n');
}

function newDb(conn = schemaConnectionString) {
	return map({
		db: con => con.postgres(conn, { size: 1 })
	});
}

function runGenerateTriggers() {
	try {
		execFileSync(
			process.execPath,
			[
				path.join(process.cwd(), 'bin', 'rdb.js'),
				'sync:setup',
				'--file',
				dbTsPath
			],
			{
				cwd: process.cwd(),
				encoding: 'utf8'
			}
		);
	} catch (err) {
		const stdout = err && typeof err.stdout === 'string' ? err.stdout : '';
		const stderr = err && typeof err.stderr === 'string' ? err.stderr : '';
		throw new Error(`generate-triggers failed.\nstdout:\n${stdout}\nstderr:\n${stderr}`);
	}
}
