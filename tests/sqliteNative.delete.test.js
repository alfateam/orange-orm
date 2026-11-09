import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const orange = require('../src/index');
const nativePlugin = require('./nativeSqlitePlugin');
const { appendRoleSuffix } = require('../src/sqliteOPFS/storageLayout');
const cleanups = [];
afterEach(async () => { while (cleanups.length) await cleanups.pop()(); });
function fixture(name = 'account.sqlite3') {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'orange-native-delete-'));
	cleanups.push(() => fs.rmSync(directory, { recursive: true, force: true }));
	const plugin = nativePlugin(directory);
	const connection = `capacitor:${name}`;
	const roles = [connection, appendRoleSuffix(connection, 'b'), appendRoleSuffix(connection, 'delta')];
	function open(connectionString) {
		const db = orange.sqlite(connectionString, { capacitorSQLite: plugin });
		cleanups.push(() => db.end()); return db;
	}
	async function seed() {
		for (const role of [...roles, 'capacitor:other.sqlite3']) {
			const db = open(role);
			await db.query('CREATE TABLE retained(id INTEGER)');
			await db.query('INSERT INTO retained VALUES (7)');
			await db.end();
		}
	}
	return { plugin, connection, roles, seed, open, files: () => fs.readdirSync(directory).sort() };
}

test.each(['account.sqlite3', 'account'])('public deletion owns role layout for %s and preserves other databases', async name => {
	const f = fixture(name); await f.seed();
	await orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true });
	expect(f.files()).toEqual(['other.sqlite3SQLite.db']);
	await orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true });
	expect(f.files()).toEqual(['other.sqlite3SQLite.db']);
	expect(await f.open('capacitor:other.sqlite3').query('SELECT * FROM retained')).toEqual([{ id: 7 }]);
});

test('without sync only the named database is deleted', async () => {
	const f = fixture(); await f.seed();
	await orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin });
	for (const role of f.roles.slice(1)) expect(await f.open(role).query('SELECT * FROM retained')).toEqual([{ id: 7 }]);
});

test('failed deletion releases its connection and partial deletion is retryable', async () => {
	const f = fixture(); await f.seed();
	f.plugin.failWhen(sql => sql === `DELETE DATABASE ${f.roles[1].slice('capacitor:'.length)}`);
	await expect(orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true })).rejects.toThrow('Injected native failure');
	f.plugin.failWhen(null);
	await orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true });
	expect(f.files()).toEqual(['other.sqlite3SQLite.db']);
});

test('validates all targets and refuses any live role before deleting anything', async () => {
	const f = fixture(); await f.seed();
	const before = f.files();
	for (const invalid of ['other', 'capacitor:../other', 'capacitor:alias.db', 'capacitor:'])
		await expect(orange.deleteSqliteNative(invalid, { capacitorSQLite: f.plugin, sync: true })).rejects.toThrow();
	await expect(orange.deleteSqliteNative(f.connection)).rejects.toThrow('capacitorSQLite');
	// Even a lazy, unopened secondary pool must block deleting the primary.
	const secondary = f.open(f.roles[1]);
	await expect(orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true })).rejects.toThrow('Close all');
	expect(f.files()).toEqual(before);
	await secondary.end();
	await orange.deleteSqliteNative(f.connection, { capacitorSQLite: f.plugin, sync: true });
});
