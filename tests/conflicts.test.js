const map = require('./db');
import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const express = require('express');
import { json } from 'body-parser';
import cors from 'cors';
const initPg = require('./initPg');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const port = 3007;
let server;


beforeAll(async () => {
	await createMs('mssql');
	hostExpress();

	async function createMs(dbName) {
		const { db } = getDb(dbName);
		const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
		await db.query(sql);
	}

	function hostExpress() {
		const { db } = getDb('sqlite2');
		let app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express());
		server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
	}
}, 20000);

afterAll(async () => {

	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
}, 20000);

describe('optimistic fail', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {

		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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

describe('optimistic json object', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
			await init(db);



		const customer = await db.customer2.insert({
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			picture: null,
			data: {foo: 1, bar: {baz: {bar: 2, zeta: {hello: 'world'}}}},
		});

		const customer2 = await db.customer2.getById(customer.id);
		customer2.data.bar.baz.bar = 'changedBy2';
		await customer2.saveChanges();


		customer.data.bar.baz.zeta = 'changedBy1';
		await customer.saveChanges();

		const expected = {
			id: customer.id,
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			picture: null,
			data: {foo: 1, bar: {baz: {bar: 'changedBy2', zeta: 'changedBy1'}}},
		};

		expect(customer).toEqual(expected);
	}
});

describe('optimistic fail json object', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
			await init(db);

		const customer = await db.customer2.insert({
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			picture: null,
			data: {foo: 1, bar: {baz: {bar: 2, zeta: {hello: 'world'}}}},
		});

		const customer2 = await db.customer2.getById(customer.id);
		customer2.data.bar.baz.bar = 'changedBy2';
		await customer2.saveChanges();



		let error;
		try {
			customer.data.bar.baz.bar = 'changedBy1';
			await customer.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The row was changed by another user.');




		// const expected = {
		// 	id: customer.id,
		// 	name: 'Voldemort',
		// 	balance: -200,
		// 	isActive: true,
		// 	picture: null,
		// 	data: {foo: 1, bar: {baz: {bar: 'changedBy2', zeta: 'changedBy1'}}},
		// };

		// expect(customer).toEqual(expected);
	}
});


describe('insert skipOnConflict with overwrite column', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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

		george2.name = 'John 2';
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
}, 20000);

describe('savechanges overload optimistic', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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

		george2.name = 'John 2';
		let error;
		try {
			await george2.saveChanges({ name: { concurrency: 'optimistic' } });
		}
		catch (e) {
			error = e;
		}
		expect(error.message).toEqual('The row was changed by another user.');
	}
});

describe('insert empty skipOnConflict', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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

		expect(true).toEqual(message.indexOf('Conflict when updating') > -1 || message.indexOf('Conflict when updating a column') > -1);
	}
});

describe('insert overwrite with optimistic column unchanged', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		let { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
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

const pathSegments = __filename.split('/');
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
				}, { size: 1 })
			},),
		init: initMs
	},
	mssqlNative:
	{
		db: map({ db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes', { size: 0 }) }),
		init: initMs
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg
	},
	pglite: {
		db: map({ db: con => con.pglite( undefined, { size: 1 }) }),
		init: initPg
	},	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite
	},
	sqlite2: {
		db: map({ db: (con) => con.sqlite(sqliteName2, { size: 1 }) }),
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
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
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
	else if (name === 'pglite')
		return connections.pglite;
	else if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'd1')
		return connections.d1;
	else if (name === 'sqlite2')
		return connections.sqlite2;
	else if (name === 'sap')
		return connections.sap;
	else if (name === 'oracle')
		return connections.oracle;
	else if (name === 'mysql')
		return connections.mysql;
	else if (name === 'http')
		return connections.http;
	else
		throw new Error('unknown');
}
