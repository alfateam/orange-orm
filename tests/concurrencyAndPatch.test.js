import { describe, test, beforeEach, expect } from 'vitest';
const dateToISOString = require('../src/dateToISOString');
const rdb = require('../src/index');
const _db = require('./db');
const initPg = require('./initPg');

const date1 = new Date(2022, 0, 11, 9, 24, 47);
const date2 = new Date(2021, 0, 11, 12, 22, 45);

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

		const db = _db({ db: pool});

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

		const db = _db({ db: pool});

		const strategy = {deliveryAddress: true, lines: true, customer: true};
		let rows = await db.order.getAll(strategy);
		const original = JSON.parse(JSON.stringify(rows));

		const changedDate1 = new Date(2023, 0, 5, 9, 24, 22);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);
		const name = 'Roger';
		const postalPlace = 'Westminister';
		const line = { product: 'Drum set', id: 4, orderId: 2 };

		console.dir(dateToISOString(changedDate1));

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



function pg() {
	return { pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg };
}
