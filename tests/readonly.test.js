import { describe, test, beforeEach, expect } from 'vitest';
const rdb = require('../src/index');
const _db = require('./db');
const initPg = require('./initPg');

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
		const expectedMeta = {
			readonly: true,
			concurrency: undefined,
			hus: { id: { readonly: true }, husnummer: { readonly: true } },
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
			lines: {
				id: { readonly: true },
				orderId: { readonly: true },
				product: { readonly: true }
			}
		};
		expect(error?.message).toEqual('Cannot update column name because it is readonly');
		expect(db.metaData).toEqual(expectedMeta);
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

describe('readonly table delete', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: { readonly: true }
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: { readonly: true }
		});

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

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: {
				readonly: true,
				lines: {
					readonly: false
				}
			}
		});

		const rows = await db.order.getAll({ lines: true });

		const length = rows[0].lines.length;
		rows[0].lines.pop();
		expect(rows[0].lines.length).toEqual(length - 1);

	}
});
describe('readonly delete should not throw when only column is readonly', () => {

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

		const length = rows[0].lines.length;
		rows[0].lines.pop();
		expect(rows[0].lines.length).toEqual(length - 1);

	}
});

describe('readonly column delete', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({
			db: pool,
			order: {
				orderDate: {
					readonly: true
				}
			}
		});

		const rows = await db.order.getAll();
		const length = rows.length;
		rows.pop();
		await rows.saveChanges();
		expect(rows.length).toEqual(length - 1);
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


function pg() {
	return { pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg };
}
