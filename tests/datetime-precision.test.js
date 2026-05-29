import { beforeAll, describe, expect, test } from 'vitest';
const map = require('./db');
const initPg = require('./initPg');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');

const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;

const connections = {
	mssql: {
		db:
			map({
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
			},),
		init: initMs,
		precisionSql: [
			"UPDATE datetest SET tdatetime = '2023-07-14T12:00:00.123' WHERE id = 1"
		]
	},
	mssqlNative: {
		db: map({ db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes', { size: 0 }) }),
		init: initMs,
		precisionSql: [
			"UPDATE datetest SET tdatetime = '2023-07-14T12:00:00.123' WHERE id = 1"
		]
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg,
		precisionSql: [
			"UPDATE datetest SET tdatetime = TIMESTAMP '2023-07-14 12:00:00.123' WHERE id = 1"
		]
	},
	pglite: {
		db: map({ db: con => con.pglite(undefined, { size: 1 }) }),
		init: initPg,
		precisionSql: [
			"UPDATE datetest SET tdatetime = TIMESTAMP '2023-07-14 12:00:00.123' WHERE id = 1"
		]
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
		init: initOracle,
		precisionSql: [
			`UPDATE "datetest"
			SET "tdatetime" = TO_TIMESTAMP('2023-07-14T12:00:00.123', 'YYYY-MM-DD"T"HH24:MI:SS.FF3')
			WHERE "id" = 1`
		],
		precisionInTransaction: true
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
		init: initMysql,
		precisionSql: [
			'ALTER TABLE datetest MODIFY tdatetime DATETIME(3)',
			"UPDATE datetest SET tdatetime = '2023-07-14 12:00:00.123' WHERE id = 1"
		]
	},
	mariadb: {
		db: map({ db: (con) => con.mariadb('mariadb://test:test@mariadb/test', { size: 1 }) }),
		init: initMysql,
		precisionSql: [
			'ALTER TABLE datetest MODIFY tdatetime DATETIME(3)',
			"UPDATE datetest SET tdatetime = '2023-07-14 12:00:00.123' WHERE id = 1"
		]
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
		init: initSap,
		precisionSql: [
			"UPDATE datetest SET tdatetime = '2023-07-14T12:00:00.123' WHERE id = 1"
		]
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite,
		precisionSql: [
			"UPDATE datetest SET tdatetime = '2023-07-14T12:00:00.123' WHERE id = 1"
		]
	}
};

const dbNames = [
	'pg',
	'pglite',
	'oracle',
	'mssql',
	...(major === 18 ? ['mssqlNative'] : []),
	'mysql',
	'mariadb',
	'sap',
	'sqlite'
];

beforeAll(async () => {
	for (const name of dbNames) {
		const { db, init, precisionSql, precisionInTransaction } = connections[name];
		await init(db);
		if (precisionInTransaction) {
			await db.transaction(async (db) => {
				for (const sql of precisionSql) {
					await db.query(sql);
				}
			});
		}
		else {
			for (const sql of precisionSql) {
				await db.query(sql);
			}
		}
	}
}, 60000);

describe('datetime precision in optimistic concurrency', () => {
	for (const name of dbNames) {
		test(name, async () => {
			const { db } = connections[name];
			const row = await db.datetest.getOne();

			expect(row.id).toBe(1);
			expect(row.datetime).toContain('2023-07-14T12:00:00');

			row.datetime = null;
			await row.saveChanges();
			await row.refresh();

			expect(row.datetime).toBe(null);
		}, 60000);
	}
});
