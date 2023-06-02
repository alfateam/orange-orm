import { describe, test, beforeEach, expect } from 'vitest';
const dateToISOString = require('../src/dateToISOString');
const rdb = require('../src/index');
const _db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');

const date1 = new Date(2022, 0, 11, 9, 24, 47);
const date2 = new Date(2021, 0, 11, 12, 22, 45);

beforeEach(async () => {
	await insertData(pg());
	await insertData(mssql());

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


describe('update date', () => {

	test('pg', async () => await verify(pg()));
	test('mssql', async () => await verify(mssql()));

	async function verify({ pool }) {

		const db = _db({ db: pool });
		let row = await db.order.getOne();
		const date = new Date(2022, 0, 11, 9, 24, 47);
		row.orderDate = date;
		await row.saveChanges();
		await row.refresh();
		expect(row.orderDate).toEqual(dateToISOString(date).substring(0, row.orderDate.length));
	}
});

describe('delete date', () => {

	test('pg', async () => await verify(pg()));
	test('mssql', async () => await verify(mssql()));

	async function verify({ pool }) {

		const db = _db({ db: pool });

		let row = await db.order.getOne();
		await row.delete();
		row = await db.order.getById(row.id);
		expect(row).toEqual(undefined);
	}
});

function pg() {
	return { pool: rdb.pg('postgres://postgres:postgres@postgres/postgres'), init: initPg };
}

function mssql() {
	return {
		pool: rdb.mssql(
			{
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
}
