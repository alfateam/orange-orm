const db = require('./db');
import { describe, test, beforeAll, expect } from 'vitest';

const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');

beforeAll(async () => {

	await insertData('pg');
	await insertData('mssql');
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

// describe('dateformat raw', () => {

// 	test('pg', async () => {
// 		const { db } = getDb('pg');
// 		const result = await db.query('SELECT _date::text, _datetime::text, _datetime_tz::text FROM datetest');
// 		expect(result).toEqual([
// 			{_date: '2023-07-14', _datetime: '2023-07-14 12:00:00', _datetime_tz: '2023-07-14 20:00:00+00'}
// 		]);
// 	});



// 	test('mssql', async () => {
// 		const { db } = getDb('mssql');
// 		const result = await db.query('SELECT CONVERT(VARCHAR, _date, 120) AS _date, CONVERT(VARCHAR, _datetime, 120) AS _datetime, CONVERT(VARCHAR, _datetime_tz, 120) AS _datetime_tz FROM datetest;');
// 		expect(result).toEqual([
// 			{_date: '2023-07-14', _datetime: '2023-07-14 12:00:00', _datetime_tz: '2023-07-14 12:00:00 -08:00'}
// 		]);
// 	});

// 	test('sap', async () => {
// 		const { db } = getDb('sap');
// 		const result = await db.query('SELECT CONVERT(VARCHAR, _date, 23) AS _date, CONVERT(VARCHAR, _datetime, 23) AS _datetime, CONVERT(VARCHAR,_datetime_tz,23) AS _datetime_tz FROM datetest;');
// 		expect(result).toEqual([
// 			{_date: '2023-07-14T00:00:00', _datetime: '2023-07-14T12:00:00', _datetime_tz: '2023-07-14T12:00:00'}
// 		]);
// 	});

// 	test('mysql', async () => {
// 		const { db } = getDb('mysql');
// 		const result = await db.query('SELECT _date AS _date, _datetime AS _datetime, _datetime_tz AS _datetime_tz FROM datetest;');
// 		expect(result).toEqual([
// 			{_date: '2023-07-14', _datetime: '2023-07-14 03:00:00', _datetime_tz: '2023-07-14 20:00:00'}
// 		]);
// 	});


// });

describe('dateformat get', () => {
	const newValue = '2023-08-05T12:00:00-03:00';

	test('pg', async () => {
		const { db } = getDb('pg');
		const result = await db.datetestWithTz.getOne();
		expect(result).toEqual({id:1, date: '2023-07-14', datetime: '2023-07-14T12:00:00', datetime_tz: '2023-07-14T20:00:00+00'});
		result.date = newValue;
		result.datetime = newValue;
		result.datetime_tz = newValue;
		await result.saveChanges();
		await result.refresh();
		expect(result).toEqual({id:1, date: '2023-08-05', datetime: '2023-08-05T12:00:00', datetime_tz: '2023-08-05T15:00:00+00'});
	});

	test('mssql', async () => {
		const { db } = getDb('mssql');
		const result = await db.datetestWithTz.getOne();
		expect(result).toEqual({id: 1, date: '2023-07-14', datetime: '2023-07-14T12:00:00', datetime_tz: '2023-07-14T12:00:00-08:00' });
		result.date = newValue;
		result.datetime = newValue;
		result.datetime_tz = newValue;
		await result.saveChanges();
		await result.refresh();
		expect(result).toEqual({id:1, date: '2023-08-05', datetime: '2023-08-05T12:00:00', datetime_tz: newValue});
	});

	test('sap', async () => {
		const { db } = getDb('sap');
		const result = await db.datetest.getOne();
		expect(result).toEqual({id: 1, date: '2023-07-14T00:00:00', datetime: '2023-07-14T12:00:00'});
		result.date = newValue;
		result.datetime = newValue;
		result.datetime_tz = newValue;
		await result.saveChanges();
		await result.refresh();
		expect(result).toEqual({id:1, date: '2023-08-05T00:00:00', datetime: '2023-08-05T12:00:00'});
	});

	test('mysql', async () => {
		const { db } = getDb('mysql');
		const result = await db.datetestWithTz.getOne();
		expect(result).toEqual({id: 1, date: '2023-07-14', datetime: '2023-07-14T03:00:00', datetime_tz: '2023-07-14T20:00:00'});
		result.date = newValue;
		result.datetime = newValue;
		result.datetime_tz = newValue;
		await result.saveChanges();
		await result.refresh();
		expect(result).toEqual({id:1, date: '2023-08-05', datetime: '2023-08-05T12:00:00', datetime_tz: '2023-08-05T15:00:00'});

	});

	test('sqlite', async () => {
		const { db } = getDb('sqlite');
		const result = await db.datetestWithTz.getOne();
		expect(result).toEqual({ id: 1, date: '2023-07-14T12:00:00', datetime: '2023-07-14T12:00:00', datetime_tz: '2023-07-14T12:00:00-08:00'  });
		result.date = newValue;
		result.datetime = newValue;
		result.datetime_tz = newValue;
		await result.saveChanges();
		await result.refresh();
		expect(result).toEqual({ id: 1, date: '2023-08-05T12:00:00', datetime: '2023-08-05T12:00:00' , datetime_tz: '2023-08-05T12:00:00-03:00'});
	});


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