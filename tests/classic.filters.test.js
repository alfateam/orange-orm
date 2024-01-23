import { fileURLToPath } from 'url';
import { describe, test, beforeAll, expect } from 'vitest';
import rdb from '../src/index';
const db = require('./db');
const initPg = require('./initPg');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

const Order = rdb.table('torder');
Order.column('id').numeric().primary().notNullExceptInsert(),
Order.column('orderDate').date().notNull();

const Lines = rdb.table('orderLine');
Lines.column('id').numeric().primary().notNullExceptInsert();
Lines.column('orderId').numeric();
Lines.column('product').string();

const Packages = rdb.table('package');
Packages.column('packageId').numeric().primary().notNullExceptInsert().as('id');
Packages.column('lineId').numeric();
Packages.column('sscc').string();


const lineJoin = Lines.join(Order).by('orderId').as('order');
const packageJoin = Packages.join(Lines).by('lineId').as('line');

Order.hasMany(lineJoin).as('lines');
Lines.hasMany(packageJoin).as('packages');


beforeAll(async () => {
	await createMs('mssql');
	await insertData('pg');
	await insertData('oracle');
	if (major === 18)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
	await insertData('sap');

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
});


describe('basic filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.id.eq(1);

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('basic nested filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);

		await db.transaction(async () => {
			const filter = Order.lines.packages.sscc.startsWith('aaa');
			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('any filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines(x => x.product.startsWith('Bic'));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('all filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines.all(x => x.product.contains('Bic').or(x.packages(x => x.sscc.eq('bbbb'))));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('none filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines.none(x => x.product.contains('l'));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date2 = new Date(2021, 0, 11, 12, 22, 45);
			const expected = [
				{
					id: 2,
					orderDate: dateToISOString(date2),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('any-subFilter filter', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines(x => x.packages.sscc.startsWith('aaa'));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('any-subFilter filter nested', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines(x => x.packages(x => x.sscc.startsWith('aaa')));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
	}
});

describe('any-subFilter filter nested chained', async () => {

	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const db = getClassicDb(dbName);
		await db.transaction(async () => {

			const filter = Order.lines(x => x.packages(x => x.line.order.id.eq(1)));

			let rows = await Order.getMany(filter);
			let dtos = await rows.toDto({});

			const date1 = new Date(2022, 0, 11, 9, 24, 47);
			const expected = [
				{
					id: 1,
					orderDate: dateToISOString(date1),
				}
			];

			for (let i = 0; i < dtos.length; i++) {
				dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			}

			expect(dtos).toEqual(expected);
		});
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
	else if (name === 'oracle')
		return {
			db: db.oracle(
				{
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 }

			),
			init: initOracle
		};
	else if (name === 'sqlite')
		return {
			db: db.sqlite(sqliteName),
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

	throw new Error('unknown db');
}


const pathSegments = fileURLToPath(import.meta.url).split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;

function getClassicDb(name) {
	if (name === 'mssql')
		return rdb.mssql({
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
		});
	else if (name === 'mssqlNative')
		return rdb.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes');
	else if (name === 'pg')
		return rdb.postgres('postgres://postgres:postgres@postgres/postgres');
	else if (name === 'sqlite')
		return rdb.sqlite(sqliteName);
	else if (name === 'sap')
		return rdb.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`);
	else if (name === 'oracle')
		return rdb.oracle({
			user: 'sys',
			password: 'P@assword123',
			connectString: 'oracle/XE',
			privilege: 2
		});
	else if (name === 'mysql')
		return rdb.mysql('mysql://test:test@mysql/test');
	else
		throw new Error('unknown db');
}


