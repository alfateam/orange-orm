import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const express = require('express');
import { json } from 'body-parser';
const db = require('./db');
const initSqlite = require('./initSqlite');
const dateToISOString = require('../src/dateToISOString');

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
	await insertData('sqlite2');
	hostExpress();

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
					{
						product: 'Bicycle',
						packages: [
							{ sscc: 'aaaa' }
						]
					},
					{
						product: 'Small guitar',
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
						packages: [
							{ sscc: '1234' }
						]
					}
				]
			}
		]);
	}

	function hostExpress() {
		const { db } = getDb('sqlite2');
		let app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', validateToken)
			.use('/rdb', db.express({
				order: {
					baseFilter: (db, req, _res) => {
						const customerId = Number.parseInt(req.headers.authorization.split(' ')[1]);
						return db.order.customerId.eq(Number.parseInt(customerId));
					}
				}
			}));



		server = app.listen(3004, () => console.log('Example app listening on port 3000!'));
	}
});

function validateToken(req, res, next) {
	const authHeader = req.headers.authorization;
	if (authHeader) {
		return next();
	} else
		return res.status(401).json({ error: 'Authorization header missing' });
}


describe('express update with basefilter and interceptors', () => {

	test('http', async () => await verify('http'));

	async function verify(dbName) {


		const { db } = getDb(dbName);
		db.interceptors.request.use((config) => {
			config.headers.Authorization = 'Bearer 2';
			return config;
		});

		db.interceptors.response.use(
			response => response,
			error => {
				return Promise.reject(error);
			}
		);

		const filter = db.order.lines.exists();
		let row = await db.order.getOne(filter, { lines: { orderBy: 'id'}, customer: true, deliveryAddress: true });
		row.lines.push({ product: 'Broomstick' });
		await row.saveChanges();
		await row.refresh();

		row.orderDate = dateToISOString(new Date(row.orderDate));

		const date2 = new Date(2021, 0, 11, 12, 22, 45);

		const expected = {
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
				{ product: 'Magic wand', id: 3, orderId: 2 },
				{ product: 'Broomstick', id: 4, orderId: 2 }
			]
		};

		expect(row).toEqual(expected);
	}
});



function getDb(name) {
	if (name === 'sqlite2')
		return {
			db: db.sqlite(sqliteName2),
			init: initSqlite
		};
	else if (name === 'http')
		return {
			db: db.http('http://localhost:3004/rdb'),
			// init: initSqlite
		};

	throw new Error('unknown db');
}
const sqliteName2 = `demo2${new Date().getUTCMilliseconds()}.db`;