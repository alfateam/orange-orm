import { describe, expect, test } from 'vitest';

const createSqliteOPFSWorkerClient = require('../src/sqliteOPFS/workerClient');

describe('sqliteOPFS generated worker', () => {
	test('supports importing SQLite snapshots', () => {
		const source = createSqliteOPFSWorkerClient.createWorkerSource('@sqlite.org/sqlite-wasm');

		expect(source).toContain('message.method === \'importSnapshot\'');
		expect(source).toContain('async function importSnapshot(bytes, statements, expected)');
		expect(source).toContain('sqlite3.capi.sqlite3_deserialize');
	});
});
