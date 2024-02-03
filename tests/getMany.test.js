import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { fileURLToPath } from 'url';
const express = require('express');
import { json } from 'body-parser';
import cors from 'cors';
const map = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const initOracle = require('./initOracle');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const port = 3000;

let server;

afterAll(async () => {
	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
});

beforeAll(async () => {
	await createMs('mssql');
	await insertData('oracle');
	await insertData('pg');
	await insertData('mssql');
	if (major === 18)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
	await insertData('sqlite2');
	await insertData('sap');
	await insertData('oracle');
	hostExpress();

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);

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
		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);

		await db.order.insert([
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
					{
						product: 'Bicycle',
						packages: [
							{ sscc: 'aaaa' }
						]
					},
					{
						product: 'Small guitar',
						packages: [
							{ sscc: 'bbbb' }
						]
					}
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
					{
						product: 'Magic wand',
						packages: [
							{ sscc: '1234' }
						]
					}
				]
			}
		]);
	}

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
}, 15000);

describe('offset', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({ offset: 1, limit: 1 });
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

		expect(rows.length).toEqual(1);
		const date1 = new Date(2021, 0, 11, 12, 22, 45);

		const expected = [
			{
				id: 2,
				orderDate: dateToISOString(date1),
				customerId: 2,
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('boolean filter', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(false);
		const rows = await db.order.getMany(filter);

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('empty array-filter', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.order.getMany([]);

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('AND empty-array', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.order.getMany(db.and([]));

		expect(rows.length).toBeGreaterThan(0);
	}
});

describe('AND one in array', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.order.getMany(db.and([db.order.id.notEqual(-9999999)]));

		expect(rows.length).toBeGreaterThan(0);
	}
});

describe('boolean true filter', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(true);
		const rows = await db.order.getMany(filter);

		expect(rows.length).toEqual(2);
	}
});


describe('any-subFilter filter nested', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.lines.any(x => x.packages.any(x => x.sscc.startsWith('aaa')));
		const rows = await db.order.getMany(filter);


		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const expected = [
			{
				id: 1,
				orderDate: dateToISOString(date1),
				customerId: 1,
			}
		];

		expect(rows).toEqual(expected);
	}
});


describe('getMany hasOne sub filter', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);


		const filter = db.order.deliveryAddress(x => x.name.eq('George'));
		const rows = await db.order.getMany(filter);

		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const expected = [
			{
				id: 1,
				orderDate: dateToISOString(date1),
				customerId: 1,
			}
		];

		expect(rows).toEqual(expected);
	}
});


describe('getMany none sub filter', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.lines.none(x => x.product.eq('Bicycle'));
		const rows = await db.order.getMany(filter);

		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

		const date2 = new Date(2021, 0, 11, 12, 22, 45);
		const expected = [
			{
				id: 2,
				orderDate: dateToISOString(date2),
				customerId: 2,
			}
		];

		expect(rows).toEqual(expected);
	}
});

describe('getMany', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany();

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];
		expect(rows).toEqual(expected);
	}
});

describe('getMany with column strategy', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.customer.getAll({ name: true });

		const expected = [{
			id: 1,
			name: 'George'
		}, {
			id: 2,
			name: 'Harry'
		}
		];

		expect(rows).toEqual(expected);
	}
});
describe('getMany with relations', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({ lines: {}, customer: { } , deliveryAddress: {} });

		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);
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


		expect(rows).toEqual(expected);
	}
});

describe('getMany raw filter', () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rawFilter = {
			sql: 'name like ?',
			parameters: ['%arry']
		};

		const rows = await db.customer.getMany(rawFilter);

		const expected = [
			{
				id: 2,
				name: 'Harry',
				balance: 200,
				isActive: true
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('getMany raw filter http', () => {

	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rawFilter = {
			sql: 'name like ?',
			parameters: ['%arry']
		};

		let error;
		try {
			await db.customer.getMany(rawFilter);

		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Raw filters are disallowed');
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
	sqlite: {
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
				}, {size: 1}

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
	else if (name === 'sqlite')
		return connections.sqlite;
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
