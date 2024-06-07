import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { fileURLToPath } from 'url';
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

async function globalSetup() {
	await insertData('pg');
	await insertData('oracle');
	await insertData('mssql');
	if (major === 18)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sap');
	await insertData('sqlite');
	await insertData('sqlite2');
	hostExpress();
}

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

function globalTeardown() {
	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
}

describe('updateChanges', () => {
	beforeAll(async () => {
		await globalSetup();
	});

	afterAll(async () => {
		await globalTeardown();
	});

	test('pg', async () => await verify('pg'));
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
		const originalRow = await db.order.getById(1, { deliveryAddress: true, lines: true});
		const json = JSON.stringify(originalRow);
		const row = JSON.parse(json);
		const oldRow = JSON.parse(json);

		originalRow.deliveryAddress.postalCode = '7058';
		originalRow.lines.push({ product: 'meantime' });
		await originalRow.saveChanges();

		row.lines.push({ product: 'new product' });
		row.deliveryAddress.name = 'new name';

		let changedRow = await db.order.updateChanges(row, oldRow, { deliveryAddress: true, lines: { orderBy: 'id' } });
		const expected = {
			id: 1,
			orderDate: dateToISOString(date1).substring(0, changedRow.orderDate.length),
			customerId: 1,
			deliveryAddress: {
				id: 1,
				orderId: 1,
				name: 'new name',
				street: 'Node street 1',
				postalCode: '7058',
				postalPlace: 'Jakobsli',
				countryCode: 'NO'
			},
			lines: [
				{ id: 1, orderId: 1, amount: null, product: 'Bicycle' },
				{ id: 2, orderId: 1, amount: null, product: 'Small guitar' },
				{ id: 4, orderId: 1, amount: null, product: 'meantime' },
				{ id: 5, orderId: 1, amount: null, product: 'new product' },
			]
		};

		expect(changedRow).toEqual(expected);
	}
});


describe('replace then return rows', () => {
	beforeAll(async () => {
		await globalSetup();
	});

	afterAll(async () => {
		await globalTeardown();
	});

	test('pg', async () => await verify('pg'));
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

		let originalRow = await db.order.getOne(null, { customer: true, lines: true, deliveryAddress: true, where: x => x.id.eq(1) });
		let row = {
			id: 1,
			customerId: 2,
			orderDate: originalRow.orderDate,
			lines: [
				{
					orderId: originalRow.id,
					product: 'kazoo',
					amount: 166
				}]
		};

		const returned = await db.order.replace(row, { customer: true, lines: true, deliveryAddress: true });

		const expected = {
			customer: {
				balance: 200,
				id: 2,
				isActive: true,
				name: 'Harry',
			},
			customerId: 2,
			deliveryAddress: {
				countryCode: 'NO',
				id: 1,
				name: 'George',
				orderId: 1,
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				street: 'Node street 1',
			},
			id: 1,
			lines: [
				{
					amount: 166,
					id: 4,
					orderId: 1,
					product: 'kazoo',
				},
			],
			orderDate: originalRow.orderDate,
		};

		expect(returned).toEqual(expected);

	}
});
describe('replace', () => {
	beforeAll(async () => {
		await globalSetup();
	});

	afterAll(async () => {
		await globalTeardown();
	});

	test('pg', async () => await verify('pg'));
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

		let originalRow = await db.order.getOne(null, { customer: true, lines: true, deliveryAddress: true, where: x => x.id.eq(1) });
		let row = {
			id: 1,
			customerId: 2,
			orderDate: originalRow.orderDate,
			lines: [
				{
					orderId: originalRow.id,
					product: 'kazoo',
					amount: 166
				}]
		};

		const returned = await db.order.replace(row);
		const changedRow = await db.order.getById(originalRow.id, { customer: true, lines: true, deliveryAddress: true });

		const expected = {
			customer: {
				balance: 200,
				id: 2,
				isActive: true,
				name: 'Harry',
			},
			customerId: 2,
			deliveryAddress: {
				countryCode: 'NO',
				id: 1,
				name: 'George',
				orderId: 1,
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				street: 'Node street 1',
			},
			id: 1,
			lines: [
				{
					amount: 166,
					id: 4,
					orderId: 1,
					product: 'kazoo',
				},
			],
			orderDate: originalRow.orderDate,
		};

		expect(returned).toEqual(undefined);
		expect(changedRow).toEqual(expected);

	}
});

describe('update with JSON', () => {
	beforeAll(async () => {
		await globalSetup();
	});

	afterAll(async () => {
		await globalTeardown();
	});

	test('pg', async () => await verify('pg'));
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

		let originalRow = await db.order.getOne(null, { customer: true, lines: true, deliveryAddress: true, where: x => x.id.eq(1) });

		let row = {
			id: 1,
			customerId: 2,
			lines: [
				{
					orderId: originalRow.id,
					product: 'kazoo',
					amount: 166
				}]
		};

		const returned = await db.order.update(row, { where: x => x.customerId.eq(1) });
		const changedRow = await db.order.getById(originalRow.id, { customer: true, lines: true, deliveryAddress: true });

		const expected = {
			customer: {
				balance: 200,
				id: 2,
				isActive: true,
				name: 'Harry',
			},
			customerId: 2,
			deliveryAddress: {
				countryCode: 'NO',
				id: 1,
				name: 'George',
				orderId: 1,
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				street: 'Node street 1',
			},
			id: 1,
			lines: [
				{
					amount: 166,
					id: 4,
					orderId: 1,
					product: 'kazoo',
				},
			],
			orderDate: originalRow.orderDate,
		};

		expect(returned).toEqual(undefined);
		expect(changedRow).toEqual(expected);

	}
});

describe('update with JSON then return rows', () => {
	beforeAll(async () => {
		await globalSetup();
	});

	afterAll(async () => {
		await globalTeardown();
	});

	test('pg', async () => await verify('pg'));
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

		let originalRow = await db.order.getOne(null, { customer: true, lines: true, deliveryAddress: true, where: x => x.id.eq(1) });

		let row = {
			customerId: 2,
			lines: [
				{
					orderId: originalRow.id,
					product: 'kazoo',
					amount: 166
				}]
		};

		const returned = await db.order.update(row, { where: x => x.customerId.eq(1) }, { customer: true, lines: true, deliveryAddress: true });

		const expected = [{
			customer: {
				balance: 200,
				id: 2,
				isActive: true,
				name: 'Harry',
			},
			customerId: 2,
			deliveryAddress: {
				countryCode: 'NO',
				id: 1,
				name: 'George',
				orderId: 1,
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				street: 'Node street 1',
			},
			id: 1,
			lines: [
				{
					amount: 166,
					id: 4,
					orderId: 1,
					product: 'kazoo',
				},
			],
			orderDate: originalRow.orderDate,
		}];

		expect(returned).toEqual(expected);
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
