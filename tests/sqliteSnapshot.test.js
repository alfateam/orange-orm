import { afterEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const { createSqliteSnapshotStore } = require('../src/hostExpress/sqliteSnapshot');

const directories = [];
afterEach(() => {
	for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('sqlite snapshot store', () => {
	test('builds a reusable SQLite image with schema-bound metadata', async () => {
		let reads = 0;
		const table = newTable('project', [
			column('id', 'UUIDColumn', true),
			column('name', 'StringColumn'),
			column('active', 'BooleanColumn')
		]);
		const client = { tables: { project: table } };
		const store = createSqliteSnapshotStore(client, { enabled: true }, async fn => {
			reads += 1;
			return fn({ project: { getMany: async () => [
				{ id: 'p1', name: 'One', active: true },
				{ id: 'p2', name: 'Two', active: false }
			] } });
		});

		const first = await store.getOrBuild(['project'], 42);
		const second = await store.getOrBuild(['project'], 42);
		expect(first.cacheHit).toBe(false);
		expect(second.cacheHit).toBe(true);
		expect(second.id).toBe(first.id);
		expect(first.rowCount).toBe(2);
		expect(reads).toBe(1);

		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-snapshot-test-'));
		directories.push(directory);
		const filename = path.join(directory, 'snapshot.sqlite3');
		fs.writeFileSync(filename, store.get(first.id).bytes);
		const db = new DatabaseSync(filename, { readOnly: true });
		expect(db.prepare('SELECT id, name, active FROM project ORDER BY id').all()).toEqual([
			{ id: 'p1', name: 'One', active: 1 },
			{ id: 'p2', name: 'Two', active: 0 }
		]);
		const meta = db.prepare('SELECT * FROM orange_snapshot_meta').get();
		expect(meta.row_count).toBe(2);
		expect(meta.watermark_json).toBe('42');
		db.close();
	});

	test('deduplicates concurrent builds', async () => {
		let reads = 0;
		const client = { tables: { project: newTable('project', [column('id', 'NumberColumn', true)]) } };
		const store = createSqliteSnapshotStore(client, true, async fn => {
			reads += 1;
			await Promise.resolve();
			return fn({ project: { getMany: async () => [{ id: 1 }] } });
		});
		const [a, b] = await Promise.all([
			store.getOrBuild(['project'], 1),
			store.getOrBuild(['project'], 1)
		]);
		expect(a.id).toBe(b.id);
		expect(reads).toBe(1);
	});
});

function column(name, tsType, primary = false) {
	return { alias: name, _dbName: name, tsType, isPrimary: primary, _notNull: primary };
}

function newTable(dbName, columns) {
	return {
		_dbName: dbName,
		_columns: columns,
		_primaryColumns: columns.filter(value => value.isPrimary),
		_relations: {}
	};
}
