import { describe, test, beforeAll, afterAll, expect } from 'vitest';
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
	await insertData('pg');
	await insertData('pglite');
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

		await db.bigintParent.insert([
			{
				id: BigInt('9999999999999999'),
				foo: 100,
				children: [{

					bar: 1000,
				}]
			},
			{
				id: '9999999999999991',
				foo: 200,
				children: [{
					bar: 2000,
				}]
			}]);

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
						amount: 678.90,
						packages: [
							{ sscc: 'aaaa' }
						]
					},
					{
						product: 'Small guitar',
						amount: 123.45,
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
						amount: 300,
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
}, 30000);

describe('offset', () => {
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
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(false);
		const rows = await db.order.getMany({where: () => filter});

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('boolean filter where direct', () => {
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
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(false);
		const rows = await db.order.getMany({ where: filter });

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('boolean legacy filter', () => {
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
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(false);
		const rows = await db.order.getMany(filter);

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('getOne ', () => {
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
		const { db } = getDb(dbName);
		const row = await db.customer.getOne({});

		expect(row).toBeDefined();
		expect(row).toHaveProperty('id');
		expect(row.id).toBeTypeOf('number');
	}

	test('sqlite strategy first', async () => {
		const { db } = getDb('sqlite');
		const row = await db.customer.getOne({
			isActive: true
		});

		const expected = {
			id: 1,
			isActive: true
		};

		expect(row).toEqual(expected);
	});

	test('sqlite strategy first with where (boolean column)', async () => {
		const { db } = getDb('sqlite');
		const row = await db.customer.getOne({
			isActive: true,
			where: x => x.id.eq(2)
		});

		const expected = {
			id: 2,
			isActive: true
		};

		expect(row).toEqual(expected);
	});

	test('sqlite object pk filter first with strategy second', async () => {
		const { db } = getDb('sqlite');
		const row = await db.customer.getOne({ id: 2 }, { isActive: true });

		const expected = {
			id: 2,
			isActive: true
		};

		expect(row).toEqual(expected);
	});

	test('sqlite sql filter first with strategy second', async () => {
		const { db } = getDb('sqlite');
		const row = await db.customer.getOne(db.customer.id.eq(2), { isActive: true });

		const expected = {
			id: 2,
			isActive: true
		};

		expect(row).toEqual(expected);
	});

	test('sqlite raw sql filter first with strategy second', async () => {
		const { db } = getDb('sqlite');
		const row = await db.customer.getOne({ sql: 'id=2' }, { isActive: true });

		const expected = {
			id: 2,
			isActive: true
		};

		expect(row).toEqual(expected);
	});
});

describe('empty array-filter legacy', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.order.getMany([]);

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('primary key filter array', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany({ isActive: true, where: () => {return [{ id: 2 }];}});

		const expected = [{
			id: 2,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});

describe('primary key filter array legacy', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany([{ id: 2 }], { isActive: true });

		const expected = [{
			id: 2,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});

describe('empty array-filter', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.order.getMany({ where: () => []});

		const expected = [];

		expect(rows).toEqual(expected);
	}
});

describe('AND empty-array', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
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
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
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
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.customer.isActive.eq(true);
		const rows = await db.order.getMany(filter);

		expect(rows.length).toEqual(2);
	}
});

describe('in filter', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany({
			where: x => x.id.in([1]),
			orderBy: 'id'
		});

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});

describe('in filter on string column', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany({
			where: x => x.name.in(['George']),
			orderBy: 'id'
		});

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});

describe('in filter with OR', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany({
			where: x => x.id.in([1]).or(x.id.in([2])),
			orderBy: 'id'
		});

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
		}];

		expect(rows).toEqual(expected);
	}
});

describe('in filter with AND', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getMany({
			where: x => x.id.in([1, 2]).and(x.balance.greaterThan(180)),
			orderBy: 'id'
		});

		const expected = [{
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});

describe('in filter with NOT and combined OR/AND', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getAll({
			where: x => x.id.in([1]).not().and(x.id.in([1, 2]).or(x.id.in([999]))),
			orderBy: 'id'
		});

		const expected = [{
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}];

		expect(rows).toEqual(expected);
	}
});


describe('any-subFilter filter nested', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
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
		const rows = await db.order.getMany({where: () => filter});


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

describe('any-subFilter legacy filter nested', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
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

describe('any-subFilter filter nested where', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.order.getMany(null, { where: (order) => order.lines.any(x => x.packages.any(x => x.sscc.startsWith('aaa'))) });


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
		const { db } = getDb(dbName);


		const filter = db.order.deliveryAddress(x => x.name.eq('George'));
		const rows = await db.order.getMany( { where: () => filter});

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

describe('getMany hasOne sub legacy filter', () => {

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

describe('bigint getMany hasOne sub filter', () => {

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
		const { db } = getDb(dbName);


		const filter = db.bigintParent.children.bar.eq(2000);
		const rows = await db.bigintParent.getMany(filter, {
			children: true,
		});

		const expected = [
			{
				id: '9999999999999991',
				foo: 200,
				children: [{
					id: '2',
					bar: 2000,
					parentId: '9999999999999991',
				}]
			}
		];

		expect(rows).toEqual(expected);
	}
});


describe('getMany none sub filter', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
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
		const { db } = getDb(dbName);
		const rows = await db.customer.getAll({
			where: x => {
				if (dbName === 'pg' || dbName === 'pglite')
					return x.name.iContains('harry').or(x.name.iContains('george'));
				else
					return x.name.contains('harry').or(x.name.contains('george'));
			}
		});

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

describe('getAll orderBy array', () => {

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
		const { db } = getDb(dbName);
		const rows = await db.customer.getAll({ orderBy: ['id desc', 'balance'] });

		const expected = [{
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		},
		{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}
		];
		expect(rows).toEqual(expected);
	}
});

describe('getMany with column strategy', () => {

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

describe('aggregate', () => {
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
		const { db } = getDb(dbName);

		const rows = await db.orderLine.aggregate({
			orderId: x => x.orderId,
			count: x => x.count(x => x.id),
		});

		rows.sort((a, b) => a.orderId - b.orderId);

		const expected = [
			{
				orderId: 1,
				count: 2,
			},
			{
				orderId: 2,
				count: 1,
			}
		];

		expect(rows).toEqual(expected);
	}
}, 20000);
describe('aggregate on relations', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);


		const rows = await db.order.aggregate({
			where: x => x.customer.name.notEqual(null),
			customerId: x => x.customerId,
			customerName: x => x.customer.name,
			postalPlace: x => x.deliveryAddress.postalPlace,
			numberOfPackages: x => x.count(x => x.lines.packages.id),
			sumPackages: x => x.sum(x => x.lines.packages.id),
		});

		rows.sort((a, b) => a.customerId - b.customerId);

		const expected = [
			{
				customerId: 1,
				customerName: 'George',
				postalPlace: 'Jakobsli',
				numberOfPackages: 2,
				sumPackages: 3,
			},
			{
				customerId: 2,
				customerName: 'Harry',
				postalPlace: 'Surrey',
				numberOfPackages: 1,
				sumPackages: 3,
			}
		];

		expect(rows).toEqual(expected);
	}
}, 20000);

describe('aggregate each row', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const rows = await db.order.getAll({

			where: x => x.customer.name.notEqual(null),
			customerName: x => x.customer.name,
			id2: x => x.id,
			lines: {
				product: true,
				id2: x => x.id,
				foo: x => x.count(x => x.id), //weird, but ok..
				numberOfPackages: x => x.count(x => x.packages.id)
			},
			customer: {
				bar: x => x.balance
			},

			postalPlace: x => x.deliveryAddress.postalPlace,
			maxLines: x => x.max(x => x.lines.id),
			numberOfPackages: x => x.count(x => x.lines.packages.id),
			sumPackages: x => x.sum(x => x.lines.packages.id),
			balance: x => x.min(x => x.customer.balance),
			totalAmount: x => x.sum(x => x.lines.amount),
			customerId2: x => x.sum(x => x.customer.id),
		});

		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
		}
		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);
		const expected = [
			{
				id: 1,
				id2: 1,
				customerName: 'George',
				postalPlace: 'Jakobsli',
				orderDate: dateToISOString(date1),
				customerId: 1,
				maxLines: 2,
				numberOfPackages: 2,
				sumPackages: 3,
				balance: 177,
				totalAmount: 802.35,
				customerId2: 1,
				lines: [
					{ id2: 1, foo: 1, product: 'Bicycle', id: 1, orderId: 1, numberOfPackages: 1 },
					{ id2: 2, foo: 1, product: 'Small guitar', id: 2, orderId: 1, numberOfPackages: 1 }
				],
				customer: {
					id: 1,
					name: 'George',
					balance: 177,
					isActive: true,
					bar: 177
				},
			},
			{
				id: 2,
				id2: 2,
				customerName: 'Harry',
				postalPlace: 'Surrey',
				orderDate: dateToISOString(date2),
				customerId: 2,
				maxLines: 3,
				numberOfPackages: 1,
				sumPackages: 3,
				balance: 200,
				totalAmount: 300,
				customerId2: 2,
				lines: [
					{ id2: 3, foo: 1, product: 'Magic wand', id: 3, orderId: 2, numberOfPackages: 1 }
				],
				customer: {
					id: 2,
					name: 'Harry',
					balance: 200,
					isActive: true,
					bar: 200
				},
			}
		];

		expect(rows).toEqual(expected);
	}
}, 30000);

describe('getMany with relations', () => {
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
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({ lines: {}, customer: {}, deliveryAddress: {} });

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
					{ product: 'Bicycle', id: 1, amount: 678.90, orderId: 1 },
					{ product: 'Small guitar', id: 2, amount: 123.45, orderId: 1 }
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
					{ product: 'Magic wand', id: 3, amount: 300, orderId: 2 }
				]
			}
		];

		expect(rows).toEqual(expected);
	}
});
describe('getMany with references - many', () => {
	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite')); test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({
			customer: {
				orders: true
			}
		});

		//mssql workaround because datetime has no time offset
		for (let i = 0; i < rows.length; i++) {
			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
			for (let j = 0; j < rows[i].customer.orders.length; j++) {
				rows[i].customer.orders[j].orderDate = dateToISOString(new Date(rows[i].customer.orders[j].orderDate));
			}
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
					isActive: true,
					orders: [{
						id: 1,
						orderDate: dateToISOString(date1),
						customerId: 1,
					}]
				},
			},
			{
				id: 2,
				customerId: 2,
				customer: {
					id: 2,
					name: 'Harry',
					balance: 200,
					isActive: true,
					orders: [{
						id: 2,
						orderDate: dateToISOString(date2),
						customerId: 2,
					}]
				},
				orderDate: dateToISOString(date2),
			}
		];


		expect(rows).toEqual(expected);
	}
});
describe('getMany with references to discriminator', () => {
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
		const { db } = getDb(dbName);

		const rows = await db.order.getAll({ customerDiscr: {} });

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
				customerDiscr: null
			},
			{
				id: 2,
				customerId: 2,
				customerDiscr: {
					id: 2,
					name: 'Harry',
					balance: 200,
					isActive: true
				},
				orderDate: dateToISOString(date2),
			}
		];

		expect(rows).toEqual(expected);
	}
});
describe('getMany with filtered relations', () => {
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
		const { db } = getDb(dbName);
		const rows = await db.order.getMany(db.order.customer.name.notEqual(null), {
			lines: {
				where: x => x.product.eq('Bicycle').or(x.product.startsWith('Magic'))
			},
			customer: {
				where: (x => x.name.startsWith('Harry'))
			},
			deliveryAddress: {
				where: (x => x.name.startsWith('Harry'))
			}
		});

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
				deliveryAddress: null,
				customerId: 1,
				customer: null,
				lines: [
					{ product: 'Bicycle', id: 1, amount: 678.9, orderId: 1 },
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
					{ product: 'Magic wand', amount: 300, id: 3, orderId: 2 }
				]
			}
		];


		expect(rows).toEqual(expected);
	}
}, 999999);

describe('getMany composite', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		await db.compositeOrder.insertAndForget({
			companyId: 'test',
			orderNo: 1,
			lines: [{
				lineNo: 1,
				product: 'abc'
			}, {
				lineNo: 2,
				product: 'def'
			}]
		});

		const rows = await db.compositeOrder.getAll({ lines: true });

		const expected = [
			{
				companyId: 'test',
				orderNo: 1,
				lines: [{
					companyId: 'test',
					orderNo: 1,
					lineNo: 1,
					product: 'abc'
				}, {
					companyId: 'test',
					orderNo: 1,
					lineNo: 2,
					product: 'def'
				}]
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('getMany raw filter', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const _quote = quote.bind(null, dbName);

		const rawFilter = {
			sql: `${_quote('name')} like ?`,
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

describe('getMany raw filter where', () => {

	test('pg', async () => await verify('pg'));
	test('pglite', async () => await verify('pglite'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const _quote = quote.bind(null, dbName);

		const rawFilter = {
			sql: `${_quote('name')} like ?`,
			parameters: ['%arry']
		};

		const rows = await db.customer.getMany(null, { where: () => rawFilter });

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

describe('getMany raw filter http where', () => {

	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const rawFilter = {
			sql: 'name like ?',
			parameters: ['%arry']
		};

		let error;
		try {
			await db.customer.getMany(null, { where: () => rawFilter });

		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Raw filters are disallowed');
	}
});

function quote(dbName, prop) {
	if (dbName === 'oracle')
		return `"${prop}"`;
	else
		return prop;
}

describe('getMany none raw sub filter http', () => {

	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const filter = db.order.lines.none(() => '1=2');
		let error;
		try {
			await db.order.getMany(filter);

		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Raw filters are disallowed');
	}
});

describe('getMany none raw sub filter http where', () => {

	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		let error;
		try {
			await db.order.getMany(null, { where: (order) => order.lines.none(() => '1=2') });

		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Raw filters are disallowed');
	}
});


describe('wal mode', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		await db.query('PRAGMA journal_mode = WAL');
		await db.query('PRAGMA journal_mode');
		await db.query('ATTACH DATABASE "other.db" AS other');
		await db.query('DROP TABLE IF EXISTS other.orderNote');
		await db.query('CREATE TABLE other.orderNote (id INTEGER PRIMARY KEY, orderId INTEGER, note TEXT)');
		await db.query('INSERT INTO other.orderNote (id, orderId, note) VALUES (1, 2, \'WAL\')');

		const rows = await db.orderNote.getAll({
			where: (note) => note.note.eq('WAL'),
			order: true
		});
		for (let i = 0; i < rows.length; i++) {
			rows[i].order.orderDate = dateToISOString(new Date(rows[i].order.orderDate));
		}

		const date1 = new Date(2021, 0, 11, 12, 22, 45);

		const expected = [
			{
				id: 1,
				orderId: 2,
				note: 'WAL',
				order: {
					id: 2,
					orderDate: dateToISOString(date1),
					customerId: 2
				}
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('sqlite function', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		db.function('add_prefix', (text, prefix) => {
			return `${prefix}${text}`;
		});

		const rows = await db.query('SELECT id, name, add_prefix(name, \'[VIP] \') AS prefixedName FROM customer');

		const expected = [
			{
				id: 1,
				name: 'George',
				prefixedName: '[VIP] George'
			},
			{
				id: 2,
				name: 'Harry',
				prefixedName: '[VIP] Harry'
			}];
		expect(rows).toEqual(expected);
	}
});

describe('sqlite function in transaction', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		await db.transaction(async (db) => {
			db.function('add_prefix', (text, prefix) => {
				return `${prefix}${text}`;
			});

			const rows = await db.query('SELECT id, name, add_prefix(name, \'[VIP] \') AS prefixedName FROM customer');

			const expected = [
				{
					id: 1,
					name: 'George',
					prefixedName: '[VIP] George'
				},
				{
					id: 2,
					name: 'Harry',
					prefixedName: '[VIP] Harry'
				}];
			expect(rows).toEqual(expected);
		});
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
		db: map({ db: con => con.pglite(undefined, { size: 1 }) }),
		init: initPg
	}, sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite
	},
	sqlite2: {
		db: map({ db: (con) => con.sqlite(sqliteName2, { size: 1 }) }),
		init: initSqlite
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master;SortOrder=nocase_utf8;CharSet=utf8`, { size: 1 }) }),
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
