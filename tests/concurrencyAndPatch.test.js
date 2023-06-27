import { describe, test, beforeEach, expect } from 'vitest';
const dateToISOString = require('../src/dateToISOString');
const rdb = require('../src/index');
const _db = require('./db');
const initPg = require('./initPg');

const date1 = new Date(2022, 0, 11, 9, 24, 47);
const date2 = new Date(2021, 0, 11, 12, 22, 45);
const customer2Id = 2;

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


describe('patch single row', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool });

		let row = await db.customer.getOne();
		const original = JSON.parse(JSON.stringify(row));

		const name = 'Oscar';
		row.name = name;

		const expected = {
			id: 1,
			name: name,
			balance: 177,
			isActive: true
		};

		const patch = db.createPatch(original, row);
		await db.customer.patch(patch);
		row = await db.customer.getOne();
		expect(row).toEqual(expected);
	}
});

describe('patch array', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool });

		const strategy = { deliveryAddress: true, lines: true, customer: true };
		let rows = await db.order.getAll(strategy);
		const original = JSON.parse(JSON.stringify(rows));

		const changedDate1 = new Date(2023, 0, 5, 9, 24, 22);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);
		const name = 'Roger';
		const postalPlace = 'Westminister';
		const line = { product: 'Drum set', id: 4, orderId: 2 };

		const expected = [
			{
				id: 1,
				orderDate: dateToISOString(changedDate1),
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
					name: name,
					street: 'Node street 1',
					postalCode: '7059',
					postalPlace: postalPlace,
					countryCode: 'NO'
				},
				lines: [
					{ product: 'Bicycle', id: 1, orderId: 1 },
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
				deliveryAddress: null,
				orderDate: dateToISOString(date2),
				lines: [
					{ product: 'Piano', id: 3, orderId: 2 },
					line
				]
			}
		];

		rows[0].deliveryAddress.name = name;
		rows[0].orderDate = changedDate1;
		rows[0].lines.pop();
		rows[0].deliveryAddress.postalPlace = postalPlace;
		rows[1].lines.push(line);
		delete rows[1].deliveryAddress;

		const patch = db.createPatch(original, rows);
		await db.order.patch(patch);
		rows = await db.order.getAll(strategy);
		expect(rows).toEqual(expected);
	}
});


describe('concurrency default', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool });

		let row = await db.customer.getOne();

		let changedRow = await db.customer.getOne();
		const name = 'Roger';
		changedRow.name = name;
		await changedRow.saveChanges();

		let error;
		try {
			row.name = name;
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('The field name was changed by another user. Expected \'George\', but was \'Roger\'.');
	}
});

describe('concurrency skipOnConflict', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool, concurrency: 'skipOnConflict' });

		let row = await db.customer.getOne();
		let changedRow = await db.customer.getOne();
		const name = 'Roger';
		changedRow.name = name;
		await changedRow.saveChanges();

		row.name = 'Mickey';
		await row.saveChanges();
		expect(row.name).toEqual(name);
	}
});

describe('concurrency overwrite', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {

		const db = _db({ db: pool, concurrency: 'overwrite' });

		let row = await db.customer.getOne();
		let changedRow = await db.customer.getOne();
		changedRow.name = 'Roger';
		await changedRow.saveChanges();

		const name = 'Roger';
		row.name = name;
		await row.saveChanges();
		expect(row.name).toEqual(name);
	}
});

describe('concurrency join, no conflict', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });
		row.customer = null;
		await row.saveChanges();
		expect(row.customerId).toEqual(null);
		expect(row.customer).toEqual(null);
	}
});

describe('concurrency join, null conflict', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		changedRow.customer = null;
		await changedRow.saveChanges();

		let error;
		row.customer = null;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was null.');
	}
});

describe('concurrency join, conflict', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		changedRow.customerId = customer2Id;
		await changedRow.saveChanges();

		let error;
		row.customerId = customer2Id;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was 2.');
	}
});

describe('concurrency join, conflict alternative syntax', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		changedRow.customerId = customer2Id;
		await changedRow.saveChanges();

		let error;
		row.customer.id = customer2Id;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was 2.');
	}
});

describe('concurrency join, conflict overwrite', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool, order: { customerId: { concurrency: 'overwrite' } } });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		changedRow.customerId = null;
		await changedRow.saveChanges();

		row.customerId = customer2Id;
		await row.saveChanges();
		expect(row.customerId).toEqual(customer2Id);
	}
});

describe('concurrency join, conflict skipOnConflict', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool, order: { customerId: { concurrency: 'skipOnConflict' } } });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		changedRow.customerId = null;
		await changedRow.saveChanges();

		row.customerId = customer2Id;
		await row.saveChanges();
		expect(row.customerId).toEqual(null);
	}
});


describe('concurrency join, conflict undefined syntax', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });

		let changedRow = await db.order.getOne(null, { customer: true });
		delete changedRow.customerId;
		await changedRow.saveChanges();

		let error;
		row.customer.id = customer2Id;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was null.');
	}
});

describe('concurrency delete join', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });
		let changedRow = await db.order.getOne(null, { customer: true });
		delete changedRow.customer;
		await changedRow.saveChanges();

		let error;
		delete row.customer;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was null.');
	}
});

describe('concurrency delete join, alternative syntax', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		let row = await db.order.getOne(null, { customer: true });
		let changedRow = await db.order.getOne(null, { customer: true });
		delete changedRow.customer;
		await changedRow.saveChanges();

		let error;
		delete row.customer.id;
		try {
			await row.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('The field customerId was changed by another user. Expected 1, but was null.');
	}
});


describe('createPatch', () => {

	test('pg', async () => await verify(pg()));

	async function verify({ pool }) {
		const db = _db({ db: pool });
		const original = {id:'12a2f0e4-d657-47ea-a96a-0b2fff0090b2', husNummer: 2};
		const modified = {id:'12a2f0e4-d657-47ea-a96a-0b2fff0090b2', husNummer: 4};
		const patch = db.createPatch(original, modified);
		const expected =  [{ 'op': 'replace', 'path': '/["12a2f0e4-d657-47ea-a96a-0b2fff0090b2"]/husNummer', 'value': 4, 'oldValue': 2 }];
		expect(patch).toEqual(expected);
	}
});



function pg() {
	return { pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg };
}
