import { describe, test, beforeAll, expect } from 'vitest';
const map = require('./db');
const initMs = require('./initMs');
const initPg = require('./initPg');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initOracle = require('./initOracle');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;

beforeAll(async () => {
	await createMs('mssql');

	async function createMs() {
		const { db } = getDb('mssql');
		const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
		await db.query(sql);
	}
});

describe('output aliases for date columns', () => {
	test('mssql: insert should not shift date columns', async () => {
		const { db, init } = getDb('mssql');
		await init(db);
		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	if (major === 18) {
		test('mssqlNative: insert should not shift date columns', async () => {
			const { db, init } = getDb('mssqlNative');
			await init(db);
			const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
			expect(row.avsluttetTid).toBeNull();
			expect(row.brukerRolleStatusTypeId).toBe(0);
		});
	}

	test('pg: insert should not shift date columns', async () => {
		const { db, init } = getDb('pg');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	test('pglite: insert should not shift date columns', async () => {
		const { db, init } = getDb('pglite');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	test('mysql: insert should not shift date columns', async () => {
		const { db, init } = getDb('mysql');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	test('sqlite: insert should not shift date columns', async () => {
		const { db, init } = getDb('sqlite');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	test('sap: insert should not shift date columns', async () => {
		const { db, init } = getDb('sap');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});

	test('oracle: insert should not shift date columns', async () => {
		const { db, init } = getDb('oracle');
		await init(db);

		const row = await db.brukerRolleLike.insert({ brukerRolleId: '11111111-1111-1111-1111-111111111111', brukerId: '22222222-2222-2222-2222-222222222222', rolleTypeId: 20, aktorId: '33333333-3333-3333-3333-333333333333', opprettetTid: new Date('2026-02-06T12:00:00Z'), avsluttetTid: null, brukerRolleStatusTypeId: 0, sistEndretAvBrukerId: null });
		expect(row.avsluttetTid).toBeNull();
		expect(row.brukerRolleStatusTypeId).toBe(0);
	});
});

const connections = {
	mssql: {
		db: map({
			db: (con) => con.mssql({
				server: 'mssql',
				options: {
					encrypt: false,
					database: 'master'
				},
				authentication: {
					type: 'default',
					options: {
						userName: 'sa',
						password: 'P@assword123',
					}
				}
			}, { size: 1 })
		}),
		init: initMs
	},
	mssqlNative: {
		db: map({
			db: (con) => con.mssqlNative(
				'server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes',
				{ size: 0 }
			)
		}),
		init: initMs
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg
	},
	pglite: {
		db: map({ db: con => con.pglite(undefined, { size: 1 }) }),
		init: initPg
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
		init: initMysql
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
		init: initSap
	},
	oracle: {
		db: map({
			db: (con) => con.oracle(
				{
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 }
			)
		}),
		init: initOracle
	}
};

function getDb(name) {
	if (name === 'mssql')
		return connections.mssql;
	else if (name === 'mssqlNative')
		return connections.mssqlNative;
	else if (name === 'pg')
		return connections.pg;
	else if (name === 'pglite')
		return connections.pglite;
	else if (name === 'mysql')
		return connections.mysql;
	else if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'sap')
		return connections.sap;
	else if (name === 'oracle')
		return connections.oracle;
	else
		throw new Error('unknown');
}












