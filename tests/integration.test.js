/* eslint-disable jest/expect-expect */
const rdb = require('rdb');
const _db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const dateToISOString = require('../src/dateToISOString');

describe('transaction', () => {

	test('pg', async () => await verify(pg()));
	test('mssql', async () => await verify(mssql()));
	test('mysql', async () => await verify(mysql()));
	test('sqlite', async () => await verify(sqlite()));
	test('sap', async () => await verify(sap()));


	async function verify({pool}) {
		const db = _db({db: pool});
		let result;
		await db.transaction(async (db) => {
			result = await db.query('select 1 as foo');
		});
		expect(result).toEqual([{foo: 1}]);
	}
});


describe('insert autoincremental', () => {

	test('pg', async () => await verify(pg()));
	test('mssql', async () => await verify(mssql()));
	test('mysql', async () => await verify(mysql()));
	test('sqlite', async () => await verify(sqlite()));
	test('sap', async () => await verify(sap()));

	async function verify({pool, init}) {
		const db = _db({db: pool});
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

describe('insert autoincremental with relations', () => {
	test('pg', async () => await verify(pg()));
	test('mssql', async () => await verify(mssql()));
	test('mysql', async () => await verify(mysql()));
	test('sqlite', async () => await verify(sqlite()));
	test('sap', async () => await verify(sap()));

	async function verify({pool, init}) {
		const db = _db({ db: pool });
		await init(db);

		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);
		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});
		const john = await db.customer.insert({
			name: 'John',
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
					{ product: 'Piano' }
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
					name: 'John',
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
					{ product: 'Piano', id: 3, orderId: 2 }
				]
			}
		];

		expect(orders).toEqual(expected);

	}

});

function pg() {
	return {pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg};
}

function mssql() {
	return {pool: rdb.mssql('server=mssql;Database=master;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes'), init: initMs};
}

function sap() {
	return {pool: rdb.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`), init: initSap};
}

function mysql() {
	return {pool: rdb.mySql('mysql://test:test@mysql/test'), init: initMysql};
}

function sqlite() {
	return {pool: rdb.sqlite(`demo${new Date().getUTCMilliseconds()}.db`), init: initSqlite};
}