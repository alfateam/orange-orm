import { describe, test, beforeEach, expect } from 'vitest';
const db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');

beforeEach(async () => {
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
			name: 'John',
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
					{ product: 'Piano' }
				]
			}
		]);
	}
});


describe('readonly everything', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {

		const db = getDb(dbName).db({ readonly: true });

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'John',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		const expectedMeta = {
			readonly: true,
			concurrency: undefined,
			customer: {
				id: { readonly: true },
				name: { readonly: true },
				balance: { readonly: true },
				isActive: { readonly: true }
			},
			order: {
				id: { readonly: true },
				orderDate: { readonly: true },
				customerId: { readonly: true },
				lines: {
					id: { readonly: true },
					orderId: { readonly: true },
					product: { readonly: true }
				},
				deliveryAddress: {
					id: { readonly: true },
					orderId: { readonly: true },
					name: { readonly: true },
					street: { readonly: true },
					postalCode: { readonly: true },
					postalPlace: { readonly: true },
					countryCode: { readonly: true }
				}
			},
			deliveryAddress: {
				id: { readonly: true },
				orderId: { readonly: true },
				name: { readonly: true },
				street: { readonly: true },
				postalCode: { readonly: true },
				postalPlace: { readonly: true },
				countryCode: { readonly: true }
			},
			orderLine: {
				id: { readonly: true },
				orderId: { readonly: true },
				product: { readonly: true }
			}
		};
		expect(error?.message).toEqual('Cannot update column name because it is readonly');
		console.dir(db.metaData, { depth: Infinity });
		expect(db.metaData).toEqual(expectedMeta);
	}
});

describe('readonly table', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ customer: { readonly: true } });

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'John',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot update column name because it is readonly');
	}
});

describe('readonly table delete', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { readonly: true } });

		const rows = await db.order.getAll();
		let error;

		try {
			rows.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete _order because it is readonly');
	}
});

describe('readonly nested table delete', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { readonly: true } });

		const rows = await db.order.getAll({ lines: true });
		let error;

		try {
			rows[0].lines.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete orderLine because it is readonly');
	}
});
describe('readonly on grandChildren table delete', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { lines: { readonly: true } } });

		const rows = await db.order.getAll({ lines: true });
		let error;

		try {
			rows.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete orderLine because it is readonly');
	}
});

describe('readonly nested table delete override', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { readonly: true, lines: { readonly: false } } });

		const rows = await db.order.getAll({ lines: true });

		const length = rows[0].lines.length;
		rows[0].lines.pop();
		expect(rows[0].lines.length).toEqual(length - 1);

	}
});

describe('readonly column delete', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { orderDate: { readonly: true } } });

		const rows = await db.order.getAll();
		const length = rows.length;
		rows.pop();
		await rows.saveChanges();
		expect(rows.length).toEqual(length - 1);
	}
});

describe('readonly column no change', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ customer: { balance: { readonly: true } } });

		const rows = await db.customer.getAll();
		const name = 'Oscar';

		const expected = [{
			id: 1,
			name: name,
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'John',
			balance: 200,
			isActive: true
		}
		];

		rows[0].name = name;
		await rows.saveChanges();
		expect(rows).toEqual(expected);
	}
});

describe('readonly column', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ customer: { name: { readonly: true } } });

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'John',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column name because it is readonly');
	}
});

describe('readonly nested column', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { lines: { product: { readonly: true } } } });

		const rows = await db.order.getAll({ lines: true });
		let error;
		try {
			rows[0].lines[0].product = 'changed product';
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column product because it is readonly');
	}
});

describe('readonly nested table', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ order: { lines: { readonly: true } } });

		const rows = await db.order.getAll({ lines: true });
		let error;
		try {
			rows[0].lines[0].product = 'changed product';
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column product because it is readonly');
	}
});

describe('readonly table with column override', () => {

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));


	async function verify(dbName) {
		const db = getDb(dbName).db({ customer: { readonly: true, name: { readonly: false } } });

		const rows = await db.customer.getAll();
		const name = 'Oscar';

		const expected = [{
			id: 1,
			name: name,
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'John',
			balance: 200,
			isActive: true
		}
		];

		rows[0].name = name;
		await rows.saveChanges();
		expect(rows).toEqual(expected);

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

