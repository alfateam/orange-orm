import { describe, expect, test } from 'vitest';

const createSqliteOPFSWorkerClient = require('../src/sqliteOPFS/workerClient');

describe('sqliteOPFS generated worker', () => {
	test('supports importing SQLite snapshots without losing multi-database routing', () => {
		const source = createSqliteOPFSWorkerClient.createWorkerSource('@sqlite.org/sqlite-wasm');

		expect(source).toContain('message.method === \'importSnapshot\'');
		expect(source).toContain('async function importSnapshot(db, bytes, statements, expected)');
		expect(source).toContain('sqlite3.capi.sqlite3_deserialize');
		expect(source).toContain('dbByConnectionString');
	});
});
