import { describe, test, beforeEach, expect } from 'vitest';
const dateToISOString = require('../src/dateToISOString');
const db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

const date1 = new Date(2022, 0, 11, 9, 24, 47);
const date2 = new Date(2021, 0, 11, 12, 22, 45);

beforeEach(async () => {
	await insertData('pg');
	await insertData('mssql');
	if (major > 17)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sap');
	await insertData('sqlite');

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
});


describe('update date', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {

		const { db } = getDb(dbName);
		let row = await db.order.getOne();
		const date = new Date(2021, 0, 11, 9, 11, 47);
		row.orderDate = date;
		await row.saveChanges();
		await row.refresh();
		expect(row.orderDate).toEqual(dateToISOString(date).substring(0, row.orderDate.length));
	}
});

describe('update date in array', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {

		const { db } = getDb(dbName);
		let rows = await db.order.getMany();
		const date = new Date(2021, 0, 11, 9, 11, 47);

		rows[0].orderDate = date;
		await rows.saveChanges();
		await rows.refresh();
		expect(rows[0].orderDate).toEqual(dateToISOString(date).substring(0, rows[0].orderDate.length));
	}
});

describe('delete date', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sap', async () => await verify('sap'));
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {

		const { db } = getDb(dbName);

		let row = await db.order.getOne();
		await row.delete();
		row = await db.order.getById(row.id);
		expect(row).toEqual(undefined);
	}
});

function getDb(name) {
	if (name === 'mssql')
		return {
			db: db({
				db: (cons) => cons.mssql({
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
			}),
			init: initMs

		};
	else if (name === 'mssqlNative')
		return {
			db: db({ db: (cons) => cons.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes') }),
			init: initMs
		};
	else if (name === 'pg')
		return {
			db: db({ db: (cons) => cons.postgres('postgres://postgres:postgres@postgres/postgres') }),
			init: initPg
		};
	else if (name === 'sqlite')
		return {
			db: db({ db: (cons) => cons.sqlite(sqliteName) }),
			init: initSqlite
		};
	else if (name === 'sap')
		return {
			db: db({ db: (cons) => cons.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`) }),
			init: initSap
		};
	else if (name === 'mysql')
		return {
			db: db({ db: (cons) => cons.mysql('mysql://test:test@mysql/test') }),
			init: initMysql
		};

	throw new Error('unknown db');
}
const sqliteName = `demo${new Date().getUTCMilliseconds()}.db`;
