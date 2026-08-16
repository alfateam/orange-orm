import { describe, expect, test } from 'vitest';

const createSqliteOPFSWorkerClient = require('../src/sqliteOPFS/workerClient');

describe('sqliteOPFS generated worker', () => {
	test('contains compilable whole-file export and restore support', () => {
		const source = createSqliteOPFSWorkerClient.createWorkerSource('@sqlite.org/sqlite-wasm');
		const script = source.replace(
			/^import sqlite3InitModule from [^;]+;/u,
			'const sqlite3InitModule = async () => ({});'
		);

		expect(source).toContain('message.method === \'exportDatabase\'');
		expect(source).toContain('message.method === \'replaceDatabase\'');
		expect(source).toContain('sqlite3.capi.sqlite3_js_db_export');
		expect(source).toContain('pool.importDb(filename, bytes)');
		expect(() => new Function(script)).not.toThrow();
	});
});
