import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const express = require('express');
const db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
import { json } from 'body-parser';
import cors from 'cors';

let server;

afterAll(async () => {
	return new Promise((res) => {
		server.close(res);
	});
});

beforeAll(async () => {
	await createMs('mssql');
	await insertData('pg');
	await insertData('mssql');
	if (major > 17)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
	await insertData('sqlite2');
	await insertData('sap');
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
		const { db }= getDb('sqlite2');
		let app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express());
		server = app.listen(3000, () => console.log('Example app listening on port 3000!'));
	}
});
describe('any-subFilter filter nested', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
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
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
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
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
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
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.customer.getMany();

		console.dir(JSON.stringify(rows), {depth: Infinity});

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
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
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
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({ lines: {}, customer: { order: { lines: { order: {} } } }, deliveryAddress: {} });
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

function getDb(name) {
	if (name === 'mssql')
		return {
			db:
				db.mssql({
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
				}),
			init: initMs

		};
	else if (name === 'mssqlNative')
		return {
			db: db.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes'),
			init: initMs
		};
	else if (name === 'pg')
		return {
			db: db.postgres('postgres://postgres:postgres@postgres/postgres'),
			init: initPg
		};
	else if (name === 'sqlite')
		return {
			db: db.sqlite(sqliteName),
			init: initSqlite
		};
	else if (name === 'sqlite2')
		return {
			db: db.sqlite(sqliteName2),
			init: initSqlite
		};
	else if (name === 'sap')
		return {
			db: db.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`),
			init: initSap
		};
	else if (name === 'mysql')
		return {
			db: db.mysql('mysql://test:test@mysql/test'),
			init: initMysql
		};
	else if (name === 'http')
		return {
			db: db.http('http://localhost:3000/rdb'),
			// init: initSqlite
		};

	throw new Error('unknown db');
}
const sqliteName = `demo${new Date().getUTCMilliseconds()}.db`;
const sqliteName2 = `demo2${new Date().getUTCMilliseconds()}.db`;