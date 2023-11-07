import { fileURLToPath } from 'url';
const map = require('./db');
import { describe, test, beforeAll, expect } from 'vitest';

const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const port = 3007;

beforeAll(async () => {
	await createMs('mssql');

	async function createMs(dbName) {
		const { db } = getDb(dbName);
		const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
		await db.query(sql);
	}
});

describe('optimistic fail', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {

		let { db, init } = getDb(dbName);
		await init(db);
		let error;

		await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		try {
			await db.vendor.insert({
				id: 1,
				name: 'George',
				balance: 177,
			});
		}
		catch (e) {
			error = e;
		}

		expect(error).toBeTruthy();
	}
});

describe('insert skipOnConflict with overwrite column', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				balance: {
					concurrency: 'overwrite'
				},
				concurrency: 'skipOnConflict'
			}
		});

		await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		const george = await db.vendor.insert({
			id: 1,
			name: 'George',
			balance: 177,
			isActive: false
		});

		const expected = {
			id: 1,
			name: 'John',
			balance: 177,
			isActive: true
		};

		expect(george).toEqual(expected);
	}
});

describe('savechanges overload overwrite', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				concurrency: 'skipOnConflict',
			},
		});

		const george = await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		const george2 = await db.vendor.getById(1);

		george.name = 'John 1';
		await george.saveChanges();

		george2.name = 'John 2'
		await george2.saveChanges({ name: { concurrency: 'overwrite' } });

		const expected = {
			id: 1,
			name: 'John 2',
			balance: 100,
			isActive: true
		};

		await george.refresh();

		expect(george2).toEqual(expected);
		expect(george).toEqual(expected);
	}
});

describe('savechanges overload optimistic', () => {
	rdb.on('query', console.dir);
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				concurrency: 'skipOnConflict',
			},
		});

		const george = await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		const george2 = await db.vendor.getById(1);

		george.name = 'John 1';
		await george.saveChanges();

		george2.name = 'John 2'
		let error;
		try {
			await george2.saveChanges({ name: { concurrency: 'optimistic' } });
		}
		catch (e) {
			error = e;
		}
		expect(error.message).toEqual(`The field name was changed by another user. Expected 'John', but was 'John 1'.`);
	}
});

describe('insert empty skipOnConflict', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			datetest: {
				concurrency: 'skipOnConflict'
			}
		});

		const row = await db.datetest.insert({});

		const expected = {
			id: 2,
			date: null,
			datetime: null
		};

		expect(row).toEqual(expected);
	}
});

describe('columnDiscriminator insert skipOnConflict with overwrite column', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendorDiscr: {
				isActive: {
					concurrency: 'overwrite'
				},
				concurrency: 'skipOnConflict'
			}
		});

		await db.vendorDiscr.insert({
			id: 99,
			name: 'John',
			isActive: false
		});

		const george = await db.vendorDiscr.insert({
			id: 99,
			name: 'George',
			isActive: true
		});

		const georgeWithoutDiscr = await db.vendor.getById(99);

		const expected = {
			id: 99,
			name: 'John',
			isActive: true
		};

		const expectedWithoutDiscr = {
			id: 99,
			name: 'John',
			isActive: true,
			balance: 1,
		};

		expect(george).toEqual(expected);
		expect(georgeWithoutDiscr).toEqual(expectedWithoutDiscr);
	}
});


describe('insert overwrite with skipOnConflict column', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				balance: {
					concurrency: 'skipOnConflict'
				},
				concurrency: 'overwrite'
			}
		});

		await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		const george = await db.vendor.insert({
			id: 1,
			name: 'George',
			balance: 177,
			isActive: false
		});

		const expected = {
			id: 1,
			name: 'George',
			balance: 100,
			isActive: false
		};

		expect(george).toEqual(expected);
	}
});

describe('insert overwrite with optimistic column changed', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				balance: {
					concurrency: 'optimistic'
				},
				concurrency: 'overwrite'
			}
		});

		db.vendor.ins;
		await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});

		let message;
		try {
			await db.vendor.insert({
				id: 1,
				name: 'George',
				balance: 177,
				isActive: false
			});
		}
		catch (e) {
			message = e.message;
		}

		expect(message).toEqual('Conflict when updating balance');
	}
});

describe('insert overwrite with optimistic column unchanged', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		await init(db);

		db = db({
			vendor: {
				balance: {
					concurrency: 'optimistic'
				},
				concurrency: 'overwrite'
			}
		});

		await db.vendor.insert({
			id: 1,
			name: 'John',
			balance: 100,
			isActive: true
		});


		const rows = await db.vendor.insert({
			id: 1,
			name: 'George',
			balance: 100,
			isActive: false
		});
		const expected = {
			id: 1,
			name: 'George',
			balance: 100,
			isActive: false
		};

		expect(rows).toEqual(expected);
	}
});

const pathSegments = fileURLToPath(import.meta.url).split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;
const sqliteName2 = `demo.${fileNameWithoutExtension}2.db`;

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
				})
			},),
		init: initMs
	},
	mssqlNative:
	{
		db: map({ db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes') }),
		init: initMs
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres') }),
		init: initPg
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName) }),
		init: initSqlite
	},
	sqlite2: {

		db: map({ db: (con) => con.sqlite(sqliteName2) }),
		init: initSqlite
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`) }),
		init: initSap
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test') }),
		init: initMysql
	},
	http: {
		db: map.http(`http://localhost:${port}/rdb`),
	}

};

function getDb(name) {
	if (name === 'mssql')
		return connections.mssql;
	else if (name === 'mssqlNative')
		return connections.mssqlNative;
	else if (name === 'pg')
		return connections.pg;
	else if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'sqlite2')
		return connections.sqlite2;
	else if (name === 'sap')
		return connections.sap;
	else if (name === 'mysql')
		return connections.mysql;
	else if (name === 'http')
		return connections.http;
	else
		throw new Error('unknown');
}
