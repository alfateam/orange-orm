import { describe, test, beforeAll, afterAll, expect } from 'vitest';

const map = require('./db');
const express = require('express');
import { json } from 'body-parser';
const initSqlite = require('./initSqlite');
const dateToISOString = require('../src/dateToISOString');
const port = 3008;
let server;
const hookCalls = [];

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
				hooks: {
					transaction: {
						beforeBegin: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'beforeBegin',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								dbQueryOk: true
							});
						},
						afterBegin: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'afterBegin',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								dbQueryOk: true
							});
						},
						beforeCommit: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'beforeCommit',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								dbQueryOk: true
							});
							if (req.headers['x-force-rollback'] === '1') {
								throw new Error('forced rollback');
							}
						},
						afterCommit: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'afterCommit',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								dbQueryOk: true
							});
						},
						afterRollback: async (_db, req, res, error) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'afterRollback',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								hasError: !!error,
								dbQueryOk: true
							});
						}
					}
				},
				order: {
					baseFilter: (db, req, _res) => {
						const customerId = Number.parseInt(req.headers.authorization.split(' ')[1]);
						return db.order.customerId.eq(Number.parseInt(customerId));
					}
				}
			}));



		server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
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

		let row = await db.order.getOne(null, {
			where: x => x.lines.exists(),
			lines: { orderBy: 'id' },
			customer: true,
			deliveryAddress: true
		});
		row.lines.push({ product: 'Broomstick', amount: 300 });
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
				{ product: 'Magic wand', amount: null, id: 3, orderId: 2 },
				{ product: 'Broomstick', amount: 300, id: 4, orderId: 2 }
			]
		};

		expect(row).toEqual(expected);
	}
});

describe('express hooks', () => {
	test('transaction hook runs for http requests', async () => {
		hookCalls.length = 0;
		const { db } = getDb('http');
		db.interceptors.request.use((config) => {
			config.headers.Authorization = 'Bearer 2';
			return config;
		});

		await db.order.getMany({ where: x => x.id.eq(2) });

		const hookNames = hookCalls.map(call => call.name);
		expect(hookCalls.length).toBeGreaterThan(0);
		expect(hookCalls[0].authorization).toBe('Bearer 2');
		expect(hookCalls[0].method).toBe('POST');
		expect(hookCalls[0].hasResponse).toBe(true);
		expect(hookCalls.every(call => call.dbQueryOk === true)).toBe(true);
		expect(hookNames).toContain('beforeBegin');
		expect(hookNames).toContain('afterBegin');
		expect(hookNames).toContain('beforeCommit');
		expect(hookNames).toContain('afterCommit');
		expect(hookNames).not.toContain('afterRollback');
	});

	test('transaction hook runs afterRollback on errors', async () => {
		hookCalls.length = 0;
		const { db } = getDb('http');
		db.interceptors.request.use((config) => {
			config.headers.Authorization = 'Bearer 2';
			config.headers['X-Force-Rollback'] = '1';
			return config;
		});

		await expect(db.order.getMany({ where: x => x.id.eq(2) }))
			.rejects.toBeTruthy();

		const hookNames = hookCalls.map(call => call.name);
		expect(hookNames).toContain('beforeBegin');
		expect(hookNames).toContain('afterBegin');
		expect(hookNames).toContain('beforeCommit');
		expect(hookNames).toContain('afterRollback');
		expect(hookNames).not.toContain('afterCommit');
		const rollbackCall = hookCalls.find(call => call.name === 'afterRollback');
		expect(rollbackCall?.hasError).toBe(true);
		expect(rollbackCall?.dbQueryOk).toBe(true);
	});
});

const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;
const sqliteName2 = `demo.${fileNameWithoutExtension}2.db`;


const connections = {
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName) }),
		init: initSqlite
	},
	sqlite2: {

		db: map({ db: (con) => con.sqlite(sqliteName2) }),
		init: initSqlite
	},
	http: {
		db: map.http(`http://localhost:${port}/rdb`),
	}

};

function getDb(name) {
	if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'sqlite2')
		return connections.sqlite2;
	else if (name === 'http')
		return connections.http;
	else
		throw new Error('unknown');
}
