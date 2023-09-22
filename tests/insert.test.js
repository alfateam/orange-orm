import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { fileURLToPath } from 'url';
const map = require('./db');
import fs from 'fs';
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const sqliteFile = 'demo.insert.db';

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

afterAll(async () => {
	await fs.promises.unlink(sqliteFile);
});

describe('transaction', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		let result;
		const { db } = getDb(dbName);

		await db.transaction(async (db) => {
			result = await db.query('select 1 as foo');
		});
		expect(result).toEqual([{ foo: 1 }]);
	}
});

describe('validate', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);

		let error;
		await init(db);

		try {
			await db.customer.insert({
				name: 'A name longer than 10 chars',
				balance: 177,
				// isActive: true
			});

		}
		catch (e) {
			error = e;
		}


		expect(error?.message).toEqual('Length cannot exceed 10 characters');
	}
});

describe('validate chained', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		let error;
		await init(db);

		try {
			await db.customer.insert({
				balance: 177,
				// isActive: true
			});

		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Name must be set');
	}
});

describe('validate JSONSchema', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		let error;
		await init(db);

		try {
			await db.customer.insert({
				balance: 177,
				name: 1
				// isActive: true
			});

		}
		catch (e) {
			error = e;
		}
		expect(error?.message?.startsWith('Column customer.name violates JSON Schema')).toBe(true);
	}
});

describe('validate notNull', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		let error;
		await init(db);

		try {
			await db.order.insert({});

		}
		catch (e) {
			error = e;
		}
		expect(error?.message?.substring(0, 45)).toBe('Column orderDate cannot be null or undefined');
	}
});

describe('validate notNullExceptInsert', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		let error;
		await init(db);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});

		const order = await db.order.insert({ orderDate: new Date() });
		order.customer = george;
		await order.saveChanges();

		try {
			order.customer = null;
			await order.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message?.substring(0, 45)).toBe('Column customerId cannot be null or undefined');
	}
});

describe('insert autoincremental', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});

		const expected = {
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		};

		expect(george).toEqual(expected);
	}
});

describe('insert default', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177
		});

		const expected = {
			id: 1,
			name: 'George',
			balance: 177,
			isActive: false
		};

		expect(george).toEqual(expected);
	}
});

describe('insert default override', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

		const george = await db.customerDefault.insert({
			name: 'George',
			balance: 177
		});

		const expected = {
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		};

		expect(george).toEqual(expected);
	}
});

describe('insert dbNull', () => {


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

		const george = await db.customerDbNull.insert({
			balance: 177
		});

		const georgeBeforeRefresh = JSON.parse(JSON.stringify(george));
		await george.refresh();

		const george2 = await db.customer.getOne();


		const expected = {
			id: 1,
			name: null,
			balance: 177,
			isActive: false
		};

		const expected2 = {
			id: 1,
			name: 'foo',
			balance: 177,
			isActive: false
		};

		expect(georgeBeforeRefresh).toEqual(expected);
		expect(george).toEqual(expected);
		expect(george2).toEqual(expected2);
	}
});

describe('insert autoincremental with relations', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});

		const john = await db.customer.insert({
			name: 'Harry',
			balance: 200,
			isActive: true
		});

		let orders = await db.order.insert([
			{
				orderDate: date1,
				customer: george,
				deliveryAddress: {
					name: 'George',
					street: 'Node street 1',
					postalCode: '7059',
					postalPlace: 'Jakobsli',
					countryCode: 'NO'
				},
				lines: [
					{ product: 'Bicycle' },
					{ product: 'Small guitar' }
				]
			},
			{
				customer: john,
				orderDate: date2,
				deliveryAddress: {
					name: 'Harry Potter',
					street: '4 Privet Drive, Little Whinging',
					postalCode: 'GU4',
					postalPlace: 'Surrey',
					countryCode: 'UK'
				},
				lines: [
					{ product: 'Magic wand' }
				]
			}
		]);

		const expected = [
			{
				id: 1,
				orderDate: dateToISOString(date1),
				customerId: 1,
				customer: {
					id: 1,
					name: 'George',
					balance: 177,
					isActive: true
				},
				deliveryAddress: {
					id: 1,
					orderId: 1,
					name: 'George',
					street: 'Node street 1',
					postalCode: '7059',
					postalPlace: 'Jakobsli',
					countryCode: 'NO'
				},
				lines: [
					{ product: 'Bicycle', id: 1, orderId: 1 },
					{ product: 'Small guitar', id: 2, orderId: 1 }
				]
			},
			{
				id: 2,
				customerId: 2,
				customer: {
					id: 2,
					name: 'Harry',
					balance: 200,
					isActive: true
				},
				orderDate: dateToISOString(date2),
				deliveryAddress: {
					id: 2,
					orderId: 2,
					name: 'Harry Potter',
					street: '4 Privet Drive, Little Whinging',
					postalCode: 'GU4',
					postalPlace: 'Surrey',
					countryCode: 'UK'
				},
				lines: [
					{ product: 'Magic wand', id: 3, orderId: 2 }
				]
			}
		];

		expect(orders).toEqual(expected);

	}

});

const sqliteName = `demo.${fileURLToPath(import.meta.url).split('/').at(-1).split('.')[0]}.db`;
const sqliteName2 = `demo.${fileURLToPath(import.meta.url).split('/').at(-1).split('.')[0]}2.db`;

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
				}, {size: 1})
			}, ),
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
