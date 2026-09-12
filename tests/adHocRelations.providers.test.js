import { DatabaseSync } from 'node:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import sqliteTestPath from './sqliteTestPath.mjs';

const orange = require('../src/index');
const map = require('./db');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initOracle = require('./initOracle');
const initPg = require('./initPg');
const initSap = require('./initSap');
const initSqlite = require('./initSqlite');

const sqliteName = sqliteTestPath('ad-hoc-relations-providers.db');

const providers = [
	{
		name: 'sqlite',
		create: () => ({
			db: map({ db: connection => connection.sqlite(sqliteName, { size: 1 }) }),
			dispose: true
		}),
		init: initSqlite
	},
	{
		name: 'd1',
		create: () => {
			const database = newD1Database();
			return {
				db: map({ db: connection => connection.d1(database) }),
				dispose: async db => {
					await db.close();
					database.close();
				}
			};
		},
		init: initSqlite
	},
	{
		name: 'pglite',
		create: () => ({
			db: map({
				db: connection => connection.pglite(undefined, {
					size: 1,
					testId: 'ad-hoc-relations-providers'
				})
			}),
			dispose: true
		}),
		init: initPg
	},
	{
		name: 'postgres',
		create: () => ({
			db: map({
				db: connection => connection.postgres(
					'postgres://postgres:postgres@postgres/postgres',
					{ size: 1 }
				)
			})
		}),
		init: initPg
	},
	{
		name: 'mssql',
		create: () => ({
			db: map({
				db: connection => connection.mssql({
					server: 'mssql',
					options: {
						encrypt: false,
						database: 'master'
					},
					authentication: {
						type: 'default',
						options: {
							userName: 'sa',
							password: 'P@assword123'
						}
					}
				}, { size: 1 })
			})
		}),
		init: initMs
	},
	{
		name: 'mysql',
		create: () => ({
			db: map({
				db: connection => connection.mysql('mysql://test:test@mysql/test', { size: 1 })
			})
		}),
		init: initMysql
	},
	{
		name: 'mariadb',
		create: () => ({
			db: map({
				db: connection => connection.mariadb('mariadb://test:test@mariadb/test', { size: 1 })
			})
		}),
		init: initMysql
	},
	{
		name: 'sap ase',
		create: () => ({
			db: map({
				db: connection => connection.sap(
					`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`,
					{ size: 1 }
				)
			})
		}),
		init: initSap
	},
	{
		name: 'oracle',
		create: () => ({
			db: map({
				db: connection => connection.oracle({
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 })
			})
		}),
		init: initOracle
	}
];

describe.each(providers)('ad-hoc relations on $name', provider => {
	let db;
	let dispose;
	let fixture;

	beforeAll(async () => {
		({ db, dispose } = provider.create());
		await provider.init(db);
		fixture = await insertFixture(db);
	}, 60000);

	afterAll(async () => {
		if (typeof dispose === 'function')
			await dispose(db);
		else if (dispose)
			await db.close();
	});

	test('batches root correlations and paginates many/one per owner', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orders.map(row => row.id)),
				orderBy: 'id',
				latestLines: (_, { db, root }) => db.orderLine.many({
					id: true,
					orderId: false,
					where: line => line.orderId.eq(root.id),
					orderBy: 'id desc',
					limit: 1
				}),
				firstLine: (_, { db, root }) => db.orderLine.one({
					id: true,
					orderId: false,
					where: line => line.orderId.eq(root.id),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.latestLines.map(line => line.id))).toEqual([
			[fixture.lines[1].id],
			[fixture.lines[3].id]
		]);
		expect(rows.map(row => row.firstLine?.id)).toEqual([
			fixture.lines[0].id,
			fixture.lines[2].id
		]);
		expect(rows[0].latestLines[0]).not.toHaveProperty('orderId');
		expect(rows[0].firstLine).not.toHaveProperty('orderId');

		const targetQueries = queries.filter(isOrderLineSelect);
		expect(targetQueries).toHaveLength(2);
		if (provider.name !== 'sap ase')
			expect(targetQueries.every(sql => /row_number\s*\(/i.test(sql))).toBe(true);
	});

	test('paginates mapped many relations per owner', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orders.map(row => row.id)),
				orderBy: 'id',
				lines: {
					id: true,
					orderId: false,
					orderBy: 'id',
					offset: 1,
					limit: 1
				}
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.lines.map(line => line.id))).toEqual([
			[fixture.lines[1].id],
			[fixture.lines[3].id]
		]);
		const targetQueries = queries.filter(isOrderLineSelect);
		expect(targetQueries).toHaveLength(1);
		if (provider.name !== 'sap ase')
			expect(targetQueries[0]).toMatch(/row_number\s*\(\s*\)\s*over\s*\(\s*partition by/i);
	});

	test('resolves root and current scope in nested strategies', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.customer.getMany({
				where: customer => customer.id.in(fixture.customers.map(customer => customer.id)),
				name: true,
				orderBy: 'id',
				orders: {
					orderDate: true,
					orderBy: 'id',
					affordableLines: (order, { db, root }) => db.orderLine.many({
						id: true,
						where: line => line.orderId.eq(order.id)
							.and(line.amount.lt(root.balance)),
						orderBy: 'id'
					})
				}
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.orders[0].affordableLines.map(line => line.id))).toEqual([
			[fixture.lines[0].id],
			[fixture.lines[2].id]
		]);
		expect(rows[0]).not.toHaveProperty('balance');
		expect(rows[0].orders[0]).toHaveProperty('id', fixture.orders[0].id);
		expect(queries.filter(isOrderLineSelect)).toHaveLength(1);
	});

	test('deduplicates complete tuples and separates partially matching scope values', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.customer.getMany({
				where: customer => customer.name.eq('Shared'),
				id: false,
				name: true,
				balance: true,
				orderBy: 'balance',
				matchingLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.product.eq(root.name)
						.and(line.amount.lt(root.balance)),
					orderBy: 'amount'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.matchingLines.map(line => line.id))).toEqual([
			[fixture.sharedLines[0].id],
			[fixture.sharedLines[0].id],
			[fixture.sharedLines[0].id, fixture.sharedLines[1].id]
		]);
		expect(rows[0]).not.toHaveProperty('id');
		const targetQueries = queries.filter(isOrderLineSelect);
		expect(targetQueries).toHaveLength(1);
		expect(scopeRowCount(targetQueries[0])).toBe(2);
		const matchingBalanceRows = rows.filter(row => Number(row.balance) === 50);
		expect(matchingBalanceRows).toHaveLength(2);
		expect(matchingBalanceRows[0].matchingLines).not.toBe(matchingBalanceRows[1].matchingLines);
		expect(matchingBalanceRows[0].matchingLines[0]).not.toBe(matchingBalanceRows[1].matchingLines[0]);
	});

	test('batches non-equality scope filters with typed date values', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orders.map(row => row.id)),
				orderBy: 'id',
				earlierDates: (_, { db, root }) => db.datetest.many({
					where: dateRow => dateRow.datetime.lt(root.orderDate),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.earlierDates.map(dateRow => dateRow.id))).toEqual([[1], [1]]);
		expect(queries.filter(isDateTestSelect)).toHaveLength(1);
	});

	test('batches and attaches composite correlations', async () => {
		const rows = await db.compositeOrder.getMany({
			orderBy: ['companyId', 'orderNo'],
			matchingLines: (_, { db, root }) => db.compositeOrderLine.many({
				companyId: false,
				orderNo: false,
				lineNo: true,
				product: true,
				where: line => line.companyId.eq(root.companyId)
					.and(line.orderNo.eq(root.orderNo)),
				orderBy: 'lineNo'
			})
		});

		expect(rows.map(row => row.matchingLines.map(line => line.product))).toEqual([
			['A-1'],
			['A-2'],
			['B-1']
		]);
		expect(rows[0].matchingLines[0]).not.toHaveProperty('companyId');
		expect(rows[0].matchingLines[0]).not.toHaveProperty('orderNo');
	});
});

async function insertFixture(db) {
	const customers = [];
	customers.push(await db.customer.insert({
		name: 'Root A',
		balance: 250,
		isActive: true
	}));
	customers.push(await db.customer.insert({
		name: 'Root B',
		balance: 50,
		isActive: true
	}));
	const sharedCustomers = [];
	sharedCustomers.push(await db.customer.insert({
		name: 'Shared',
		balance: 50,
		isActive: true
	}));
	sharedCustomers.push(await db.customer.insert({
		name: 'Shared',
		balance: 100,
		isActive: true
	}));
	sharedCustomers.push(await db.customer.insert({
		name: 'Shared',
		balance: 50,
		isActive: true
	}));

	const orders = [];
	orders.push(await db.order.insert({
		orderDate: new Date('2024-01-01T00:00:00Z'),
		customerId: customers[0].id
	}));
	orders.push(await db.order.insert({
		orderDate: new Date('2024-01-02T00:00:00Z'),
		customerId: customers[1].id
	}));
	const sharedOrder = await db.order.insert({
		orderDate: new Date('2024-01-03T00:00:00Z'),
		customerId: sharedCustomers[0].id
	});

	const lines = [];
	lines.push(await db.orderLine.insert({
		orderId: orders[0].id,
		product: 'A',
		amount: 100
	}));
	lines.push(await db.orderLine.insert({
		orderId: orders[0].id,
		product: 'B',
		amount: 300
	}));
	lines.push(await db.orderLine.insert({
		orderId: orders[1].id,
		product: 'C',
		amount: 25
	}));
	lines.push(await db.orderLine.insert({
		orderId: orders[1].id,
		product: 'D',
		amount: 75
	}));
	const sharedLines = [];
	sharedLines.push(await db.orderLine.insert({
		orderId: sharedOrder.id,
		product: 'Shared',
		amount: 25
	}));
	sharedLines.push(await db.orderLine.insert({
		orderId: sharedOrder.id,
		product: 'Shared',
		amount: 75
	}));

	await db.compositeOrder.insert([
		{ companyId: 'A', orderNo: 1 },
		{ companyId: 'A', orderNo: 2 },
		{ companyId: 'B', orderNo: 1 }
	]);
	await db.compositeOrderLine.insert([
		{ companyId: 'A', orderNo: 1, lineNo: 1, product: 'A-1' },
		{ companyId: 'A', orderNo: 2, lineNo: 1, product: 'A-2' },
		{ companyId: 'B', orderNo: 1, lineNo: 1, product: 'B-1' }
	]);

	return { customers, sharedCustomers, orders, lines, sharedLines };
}

function isOrderLineSelect(sql) {
	const normalized = sql.replace(/["`[\]]/g, '').toLowerCase();
	return /\bfrom\s+orderline\b/.test(normalized);
}

function isDateTestSelect(sql) {
	const normalized = sql.replace(/["`[\]]/g, '').toLowerCase();
	return /\bfrom\s+datetest\b/.test(normalized);
}

function scopeRowCount(sql) {
	return (sql.match(/\bunion\s+all\b/gi) || []).length + 1;
}

function newD1Database() {
	const database = new DatabaseSync(':memory:');
	return {
		prepare(sql) {
			const statement = database.prepare(sql);
			let parameters = [];
			const prepared = {
				bind(...values) {
					parameters = values;
					return prepared;
				},
				async all() {
					return { results: statement.all(...parameters) };
				},
				async run() {
					const result = statement.run(...parameters);
					return { meta: { changes: Number(result.changes) } };
				}
			};
			return prepared;
		},
		close() {
			database.close();
		}
	};
}
