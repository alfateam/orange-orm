import { describe, test, beforeEach, expect } from 'vitest';
const rdb = require('../src/index');
const _db = require('./db');
const initPg = require('./initPg');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');

beforeEach(async () => {
	await insertData(pg());

	async function insertData({ pool, init }) {
		const db = _db({ db: pool });
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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool, readonly: true });

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

describe('readonly table', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			customer: { readonly: true }
		});

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
describe('readonly column no change', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			customer: {
				balance: {
					readonly: true
				}
			}
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			customer: {
				name: {
					readonly: true
				}
			}
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: {
				lines: {
					product: {
						readonly: true
					}
				}
			}
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: {
				lines: {
					readonly: true
				}
			}
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			customer: {
				readonly: true,
				name: {
					readonly: false
				}
			}
		});

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

// describe('getMany with column strategy', () => {

// 	test('pg', async () => await verify(pg()));
// 	test('mssql', async () => await verify(mssql()));
// 	if (major > 17)
// 		test('mssqlNative', async () => await verify(mssqlNative()));
// 	test('mysql', async () => await verify(mysql()));
// 	test('sqlite', async () => await verify(sqlite()));
// 	test('sap', async () => await verify(sap()));

// 	async function verify({ pool }) {
// 		const db = _db({ db: pool });

// 		const rows = await db.customer.getAll({name: true});

// 		const expected = [{
// 			id: 1,
// 			name: 'George'
// 		}, {
// 			id: 2,
// 			name: 'John'
// 		}
// 		];

// 		expect(rows).toEqual(expected);
// 	}
// });
// describe('getMany with relations', () => {

// 	test('pg', async () => await verify(pg()));
// 	test('mssql', async () => await verify(mssql()));
// 	if (major > 17)
// 		test('mssqlNative', async () => await verify(mssqlNative()));
// 	test('mysql', async () => await verify(mysql()));
// 	test('sqlite', async () => await verify(sqlite()));
// 	test('sap', async () => await verify(sap()));

// 	async function verify({ pool }) {
// 		const db = _db({ db: pool });

// 		const rows = await db.order.getAll({ lines: {}, customer: { order: {lines: {order: {}}}}, deliveryAddress: { }});
// 		//mssql workaround because datetime has no time offset
// 		for (let i = 0; i < rows.length; i++) {
// 			rows[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
// 		}

// 		const date1 = new Date(2022, 0, 11, 9, 24, 47);
// 		const date2 = new Date(2021, 0, 11, 12, 22, 45);
// 		const expected = [
// 			{
// 				id: 1,
// 				orderDate: dateToISOString(date1),
// 				customerId: 1,
// 				customer: {
// 					id: 1,
// 					name: 'George',
// 					balance: 177,
// 					isActive: true
// 				},
// 				deliveryAddress: {
// 					id: 1,
// 					orderId: 1,
// 					name: 'George',
// 					street: 'Node street 1',
// 					postalCode: '7059',
// 					postalPlace: 'Jakobsli',
// 					countryCode: 'NO'
// 				},
// 				lines: [
// 					{ product: 'Bicycle', id: 1, orderId: 1 },
// 					{ product: 'Small guitar', id: 2, orderId: 1 }
// 				]
// 			},
// 			{
// 				id: 2,
// 				customerId: 2,
// 				customer: {
// 					id: 2,
// 					name: 'John',
// 					balance: 200,
// 					isActive: true
// 				},
// 				orderDate: dateToISOString(date2),
// 				deliveryAddress: {
// 					id: 2,
// 					orderId: 2,
// 					name: 'Harry Potter',
// 					street: '4 Privet Drive, Little Whinging',
// 					postalCode: 'GU4',
// 					postalPlace: 'Surrey',
// 					countryCode: 'UK'
// 				},
// 				lines: [
// 					{ product: 'Piano', id: 3, orderId: 2 }
// 				]
// 			}
// 		];


// 		expect(rows).toEqual(expected);
// 	}
// });

function pg() {
	return { pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg };
}
