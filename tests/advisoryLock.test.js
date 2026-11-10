import { afterAll, describe, expect, test, vi } from 'vitest';
import { rmSync } from 'node:fs';
import sqliteTestPath from './sqliteTestPath.mjs';

const orange = require('../src');
const { node } = require('../src/runtimes');
// Use the same SQLite library on both connections: separate native libraries
// do not share SQLite's in-process POSIX lock bookkeeping.
const Sqlite = node.major > 22 || (node.major === 22 && node.minor >= 5)
	? require('node:sqlite').DatabaseSync
	: require('better-sqlite3');
const { advisoryLock } = require('../src/advisoryLock');
const commit = require('../src/table/commit');
const rollback = require('../src/table/rollback');
const getTSDefinition = require('../src/getTSDefinition');
const filename = sqliteTestPath('advisory-lock.db');
const mapping = orange.map(({ table }) => ({
	view: table('lock_view').map(({ column }) => ({ id: column('id').numeric() })),
	item: table('lock"table').map(({ column }) => ({
		computed: column('computed').numeric(),
		id: column('odd"id').numeric().primary()
	}))
}));
const db = mapping.sqlite(filename, { size: 1 });
const raw = new Sqlite(filename);
raw.exec('PRAGMA busy_timeout=0');
raw.exec('CREATE TABLE "lock""table" ("odd""id" INTEGER PRIMARY KEY, computed INTEGER GENERATED ALWAYS AS ("odd""id" + 1)); CREATE VIEW lock_view AS SELECT "odd""id" AS id FROM "lock""table";');

afterAll(async () => {
	await db.close();
	raw.close();
	for (const suffix of ['', '-wal', '-shm'])
		rmSync(filename + suffix, { force: true });
});

describe('SQLite advisory locks', () => {
	test.each(['DELETE', 'WAL'])('blocks writers and releases on commit in %s mode without changing rows', async mode => {
		raw.exec('PRAGMA journal_mode=' + mode);
		await db.transaction(async tx => {
			await tx.advisoryLock('invoice:123');
			await tx.advisoryLock('invoice:456');
			expect(() => raw.exec('BEGIN IMMEDIATE')).toThrow(/locked/);
			expect(raw.prepare('SELECT COUNT(*) AS count FROM "lock""table"').get().count).toBe(0);
		});
		raw.exec('BEGIN IMMEDIATE; ROLLBACK;');
	});

	test('rolls back changes and releases the lock on callback failure', async () => {
		let saved;
		await expect(db.transaction(async tx => {
			saved = tx;
			await tx.advisoryLock('rollback');
			await tx.query('INSERT INTO "lock""table" ("odd""id") VALUES (1)');
			throw new Error('abort');
		})).rejects.toThrow('abort');
		expect(raw.prepare('SELECT COUNT(*) AS count FROM "lock""table"').get().count).toBe(0);
		raw.exec('BEGIN IMMEDIATE; ROLLBACK;');
		await expect(saved.advisoryLock('too late')).rejects.toThrow(/active local transaction/);
	});

	test('rejects reuse after commit and invalid keys', async () => {
		let saved;
		await db.transaction(async tx => {
			saved = tx;
			for (const key of ['', 12, null, 'a\0b'])
				await expect(tx.advisoryLock(key)).rejects.toThrow(/non-empty string/);
		});
		await expect(saved.advisoryLock('too late')).rejects.toThrow(/active local transaction/);
		expect(db.advisoryLock).toBeUndefined();
	});

	test('reports missing mappings and mapped views instead of taking an ineffective lock', async () => {
		const empty = orange.map(() => ({})).sqlite(filename);
		const views = orange.map(({ table }) => ({
			view: table('lock_view').map(({ column }) => ({ id: column('id').numeric() }))
		})).sqlite(filename);
		try {
			for (const client of [empty, views])
				await expect(client.transaction(tx => tx.advisoryLock('key'))).rejects.toThrow(/existing mapped table/);
		}
		finally {
			await empty.close();
			await views.close();
		}
	});
});

test('PGlite supports transaction locks with arbitrary string keys', async () => {
	const client = mapping.pglite();
	try {
		await client.transaction(async tx => {
			await tx.advisoryLock('invoice:\'ø;--');
			await tx.advisoryLock('invoice:\'ø;--');
			await tx.advisoryLock('another invoice');
			const [row] = await tx.query('SELECT count(*)::int AS count FROM pg_locks WHERE locktype = \'advisory\'');
			expect(row.count).toBe(2);
		});
		const [row] = await client.query('SELECT count(*)::int AS count FROM pg_locks WHERE locktype = \'advisory\'');
		expect(row.count).toBe(0);
	}
	finally {
		await client.close();
	}
}, 20000);

test('advisoryLock is absent on HTTP clients, including forged transaction options', async () => {
	const http = mapping.http('http://localhost:1');
	expect(http.advisoryLock).toBeUndefined();
	expect('advisoryLock' in http).toBe(false);
	expect(http({ transaction: fn => fn({}) }).advisoryLock).toBeUndefined();
	await expect(http.transaction(tx => tx.advisoryLock('key'))).rejects.toThrow(/http/);
});

test('the HTTP operation dispatcher rejects advisoryLock requests', async () => {
	const { context, events } = mockSession('pg');
	const host = require('../src/hostLocal')({
		table: mapping.item,
		isHttp: true,
		transaction: fn => fn(context)
	});
	await expect(host.post({ path: 'advisoryLock', args: ['key'] })).rejects.toThrow();
	expect(events).toEqual([]);
});

test.each([false, true])('only local generated declarations expose advisoryLock (namespace: %s)', isNamespace => {
	const tables = [{ name: 'item', table: mapping.item }];
	expect(getTSDefinition(tables, { isNamespace })).toContain('advisoryLock(key: string): Promise<void>');
	expect(getTSDefinition(tables, { isNamespace, isHttp: true })).not.toContain('advisoryLock');
});

describe('provider lifecycle', () => {
	test('MySQL pins a physical connection and destroys it if unlock fails', async () => {
		const mysql = require('mysql2');
		const events = [];
		let failRelease = false;
		const connection = {
			query(sql, _parameters, callback) {
				events.push(sql);
				if (failRelease && sql.includes('RELEASE_LOCK'))
					callback(new Error('unlock failed'));
				else
					callback(null, [{ acquired: 1, released: 1 }]);
			},
			release() { events.push('release connection'); },
			destroy() { events.push('destroy connection'); }
		};
		const createPool = vi.spyOn(mysql, 'createPool').mockImplementation(() => ({
			getConnection(callback) {
				events.push('checkout');
				callback(null, connection);
			},
			query() { throw new Error('Must query the physical connection'); },
			end() {}
		}));
		const client = mapping.mysql('mysql://unused/unused', { size: 1 });
		try {
			await client.transaction(tx => tx.advisoryLock('key'));
			expect(events[0]).toBe('checkout');
			expect(events.at(-1)).toBe('release connection');
			expect(events.filter(event => event === 'checkout')).toHaveLength(1);
			failRelease = true;
			await expect(client.transaction(tx => tx.advisoryLock('key'))).rejects.toThrow('unlock failed');
			expect(events.at(-1)).toBe('destroy connection');
		}
		finally {
			await client.close();
			createPool.mockRestore();
		}
	});

	test.each(['mysql', 'mariadb'])('%s releases each lock once, after commit and before returning the connection', async engine => {
		const { context, events } = mockSession(engine);
		await Promise.all([advisoryLock(context, 'key'), advisoryLock(context, 'key')]);
		await advisoryLock(context, 'other');
		await commit(context);
		expect(events.map(event => event.sql)).toEqual([
			'SELECT GET_LOCK(SHA2(?, 256), 31536000) AS acquired',
			'SELECT GET_LOCK(SHA2(?, 256), 31536000) AS acquired',
			'COMMIT',
			'SELECT RELEASE_LOCK(SHA2(?, 256)) AS released',
			'SELECT RELEASE_LOCK(SHA2(?, 256)) AS released',
			'release'
		]);
	});

	test('MySQL releases after rollback and preserves the callback error', async () => {
		const { context, events } = mockSession('mysql');
		await advisoryLock(context, 'key');
		await expect(rollback(context, new Error('abort'))).rejects.toThrow('abort');
		expect(events.map(event => event.sql).slice(-3)).toEqual(['ROLLBACK', 'SELECT RELEASE_LOCK(SHA2(?, 256)) AS released', 'release']);
	});

	test.each(['release failure', 'rollback failure', 'acquisition failure'])('MySQL discards the connection after %s', async failure => {
		const { context, events } = mockSession('mysql', failure);
		if (failure === 'acquisition failure')
			await expect(advisoryLock(context, 'key')).rejects.toThrow();
		else
			await advisoryLock(context, 'key');
		await expect(rollback(context, new Error('abort'))).rejects.toThrow('abort');
		expect(events.at(-1).sql).toBe('discard');
	});

	test.each(['mssql', 'mssqlNative'])('%s handles negative application-lock return codes', async engine => {
		const { context } = mockSession(engine, 'acquisition failure');
		await expect(advisoryLock(context, 'key')).rejects.toThrow(/Could not acquire/);
	});

	test('SQL Server accepts success codes from a batch with multiple result sets', async () => {
		const { context } = mockSession('mssqlNative');
		context.rdb.dbClient.executeQuery = (_query, callback) => callback(null, [undefined, [], [{ acquired: 0 }]]);
		await expect(advisoryLock(context, 'key')).resolves.toBeUndefined();
	});

	test('Oracle uses autonomous name allocation and transaction ownership', async () => {
		const { context, events } = mockSession('oracle');
		await advisoryLock(context, 'key\'--');
		expect(events[0].sql).toContain('DBMS_LOCK.ALLOCATE_UNIQUE_AUTONOMOUS');
		expect(events[0].sql).toContain('DBMS_LOCK.MAXWAIT, TRUE');
		expect(events[0].sql).not.toContain('key\'--');
		expect(events[0].parameters).toEqual(['orange-orm:advisory:key\'--']);
	});

	test('SAP ASE and contexts without a transaction fail explicitly', async () => {
		const { context } = mockSession('sap');
		await expect(advisoryLock(context, 'key')).rejects.toThrow(/not supported by sap/);
		context.rdb.transactionActive = false;
		await expect(advisoryLock(context, 'key')).rejects.toThrow(/active local transaction/);
	});
});

function mockSession(engine, failure) {
	const events = [];
	function execute(query, callback) {
		const sql = query.sql();
		events.push({ sql, parameters: query.parameters });
		if ((failure === 'release failure' && sql.includes('RELEASE_LOCK')) || (failure === 'rollback failure' && sql === 'ROLLBACK'))
			callback(new Error(failure));
		else
			callback(null, [{ acquired: failure === 'acquisition failure' ? -1 : 1, released: 1 }]);
	}
	const context = { rdb: {
		engine,
		transactionActive: true,
		changes: [],
		dbClient: { executeQuery: execute, executeCommand: execute },
		dbClientDone: error => events.push({ sql: error ? 'discard' : 'release' })
	} };
	return { context, events };
}
