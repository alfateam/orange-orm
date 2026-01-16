import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const map = require('./db');
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
const dateToISOString = require('../src/dateToISOString');
const initPg = require('./initPg');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');

const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

const date1 = new Date(2022, 0, 11, 9, 24, 47);
const date2 = new Date(2021, 0, 11, 12, 22, 45);
let server = null;
const port = 3002;


afterAll(async () => {

	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
});


beforeAll(async () => {
	await insertData('pg');
	await insertData('pglite');
	await insertData('oracle');
	await insertData('mssql');
	if (major === 18)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sap');
	await insertData('sqlite');
	await insertData('sqlite2');
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

describe('update date in array', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {

		const { db } = getDb(dbName);
		let rows = await db.order.getMany();
		const date = new Date(2021, 0, 11, 9, 11, 47);

		rows[0].orderDate = date;
		await rows.saveChanges();
		expect(rows[0].orderDate).toEqual(dateToISOString(date).substring(0, rows[0].orderDate.length));
	}
});

describe('update multiple in array', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {


		const { db } = getDb(dbName);
		let rows = await db.order.getAll({ lines: true, deliveryAddress: true, customer: true, orderBy: 'id' });
		const date1 = new Date(2021, 0, 11, 9, 11, 47);
		const date2 = new Date(2022, 0, 12, 8, 22, 46);

		rows[0].orderDate = date1;
		rows[0].deliveryAddress.street = 'Node street 2';
		rows[0].lines[1].product = 'Big guitar';

		rows[1].orderDate = date2;
		rows[1].deliveryAddress = null;
		rows[1].lines.push({ product: 'Cloak of invisibility' });

		await rows.saveChanges();
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}

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
					street: 'Node street 2',
					postalCode: '7059',
					postalPlace: 'Jakobsli',
					countryCode: 'NO'
				},
				lines: [
					{ product: 'Bicycle', amount: null, id: 1, orderId: 1 },
					{ product: 'Big guitar', amount: null, id: 2, orderId: 1 }
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
				deliveryAddress: null,
				lines: [
					{ product: 'Magic wand', amount: null, id: 3, orderId: 2 },
					{ product: 'Cloak of invisibility', amount: null, id: 4, orderId: 2 }
				]
			}
		];


		expect(rows).toEqual(expected);
	}
});

describe('delete row', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {

		const { db } = getDb(dbName);

		let row = await db.order.getOne(null, {
			lines: true
		});

		await row.delete();
		row = await db.order.getById(row.id);
		expect(row).toEqual(undefined);
	}
});

describe('update boolean', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {

		const { db } = getDb(dbName);
		let row = await db.customer.getOne();
		row.isActive = false;
		await row.saveChanges();
		expect(row.isActive).toEqual(false);
	}
});

describe('update date', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {

		const { db } = getDb(dbName);
		let row = await db.order.getOne();
		const date = new Date(2021, 0, 11, 9, 11, 47);
		row.orderDate = date;
		await row.saveChanges();
		expect(row.orderDate).toEqual(dateToISOString(date).substring(0, row.orderDate.length));
	}
});


describe('update same row twice in same transaction', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	//exclude sap because it will throw instead of truncate
	//exclude sqlite and d1 because it does not have precision

	async function verify(dbName) {

		const { db } = getDb(dbName);

		await db.transaction(async (db) =>  {
			let row = await db.customer.getById(1);
			row.balance = row.balance + 0.42335;
			await row.saveChanges();

			row = await db.customer.getById(1);
			const expectedBalance = row.balance + .22;
			row.balance = row.balance + 0.22335;
			await row.saveChanges();

			expect(row.balance).toEqual(expectedBalance);
		} );

	}

});

//this test must be last because it runs init(..)
describe('add hasOne', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db, init } = getDb(dbName);
		if (dbName === 'http') {
			const { db, init } = getDb('sqlite2');
			await init(db);
		}
		else
			await init(db);

		const row = await db.order.insert({orderDate: date1}, {deliveryAddress: true});
		row.deliveryAddress = {
			name: 'bar',
			street: 'Node street 2',
		};
		await row.saveChanges({});
		row.orderDate = dateToISOString(new Date(row.orderDate));

		const expected = {
			id: 1,
			customerId: null,
			orderDate: dateToISOString(date1),
			deliveryAddress: {
				id: 1,
				orderId: 1,
				name: 'bar',
				street: 'Node street 2',
				postalCode: null,
				postalPlace: null,
				countryCode: null
			}
		};
		expect(row).toEqual(expected);
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
