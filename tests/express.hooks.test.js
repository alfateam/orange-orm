import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const map = require('./db');
const initPg = require('./initPg');
const initMysql = require('./initMysql');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initSap = require('./initSap');

const major = Number(process.versions.node.split('.')[0]);

createExpressHookTests({
	name: 'pg',
	port: 3020,
	db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
	init: initPg
});

createExpressHookTests({
	name: 'pglite',
	port: 3021,
	db: map({ db: con => con.pglite(undefined, { size: 1 }) }),
	init: initPg
});

createExpressHookTests({
	name: 'mysql',
	port: 3022,
	db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
	init: initMysql
});

createExpressHookTests({
	name: 'oracle',
	port: 3023,
	db: map({
		db: (con) => con.oracle(
			{
				user: 'sys',
				password: 'P@assword123',
				connectString: 'oracle/XE',
				privilege: 2
			},
			{ size: 1 }
		)
	}),
	init: initOracle
});

createExpressHookTests({
	name: 'mssql',
	port: 3024,
	db: map({
		db: (con) => con.mssql({
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
		}, { size: 1 })
	}),
	init: initMs
});

if (major === 18) {
	createExpressHookTests({
		name: 'mssqlNative',
		port: 3025,
		db: map({
			db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes', { size: 0 })
		}),
		init: initMs
	});
}

createExpressHookTests({
	name: 'sap',
	port: 3026,
	db: map({
		db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 })
	}),
	init: initSap
});

function createExpressHookTests({ name, port, db, init }) {
	let server;
	const hookCalls = [];

	beforeAll(async () => {
		await seedData(db, init);
		startServer();
	});

	afterAll(async () => {
		if (server) {
			await new Promise((resolve) => server.close(resolve));
		}
		if (db?.close)
			await db.close();
	});

	describe(`express hooks ${name}`, () => {
		test('commit flow uses hook db', async () => {
			hookCalls.length = 0;
			const httpDb = map.http(`http://localhost:${port}/rdb`);
			await httpDb.order.getMany({ where: x => x.id.eq(2) });

			const hookNames = hookCalls.map(call => call.name);
			expect(hookNames).toContain('beforeBegin');
			expect(hookNames).toContain('afterBegin');
			expect(hookNames).toContain('beforeCommit');
			expect(hookNames).toContain('afterCommit');
			expect(hookNames).not.toContain('afterRollback');
		});

		test('rollback flow uses hook db', async () => {
			hookCalls.length = 0;
			const httpDb = map.http(`http://localhost:${port}/rdb`);
			httpDb.interceptors.request.use((config) => {
				config.headers['X-Force-Rollback'] = '1';
				return config;
			});

			await expect(httpDb.order.getMany({ where: x => x.id.eq(2) }))
				.rejects.toBeTruthy();

			const hookNames = hookCalls.map(call => call.name);
			expect(hookNames).toContain('beforeBegin');
			expect(hookNames).toContain('afterBegin');
			expect(hookNames).toContain('beforeCommit');
			expect(hookNames).toContain('afterRollback');
			expect(hookNames).not.toContain('afterCommit');
		});
	});

	function startServer() {
		const app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express({
				hooks: {
					transaction: {
						beforeBegin: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'beforeBegin',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function'
							});
						},
						afterBegin: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'afterBegin',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function'
							});
						},
						beforeCommit: async (_db, req, res) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'beforeCommit',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function'
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
								hasResponse: typeof res?.setHeader === 'function'
							});
						},
						afterRollback: async (_db, req, res, error) => {
							await _db.customer.count();
							hookCalls.push({
								name: 'afterRollback',
								authorization: req.headers.authorization,
								method: req.method,
								hasResponse: typeof res?.setHeader === 'function',
								hasError: !!error
							});
						}
					}
				}
			}));

		server = app.listen(port, () => {
			console.log(`Express hooks (${name}) listening on port ${port}!`);
		});
	}
}

async function seedData(db, init) {
	if (init)
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
