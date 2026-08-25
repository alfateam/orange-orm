import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import sqliteTestPath from './sqliteTestPath.mjs';
const express = require('express');
const { json } = require('body-parser');
const orange = require('../src/index');
const map = require('./db');
const initSqlite = require('./initSqlite');

const db = map.sqlite(sqliteTestPath('ad-hoc-relations.db'));
let httpDb;
let server;

beforeAll(async () => {
	await initSqlite(db);
	await db.customer.insert([
		{ id: 1, name: 'One', balance: 250, isActive: true },
		{ id: 2, name: 'Two', balance: 50, isActive: true }
	]);
	await db.order.insert([
		{ id: 10, orderDate: new Date('2024-01-01T00:00:00Z'), customerId: 1 },
		{ id: 20, orderDate: new Date('2024-01-02T00:00:00Z'), customerId: 2 }
	]);
	await db.orderLine.insert([
		{ id: 101, orderId: 10, product: 'A', amount: 100 },
		{ id: 102, orderId: 10, product: 'B', amount: 300 },
		{ id: 201, orderId: 20, product: 'C', amount: 25 },
		{ id: 202, orderId: 20, product: 'D', amount: 75 }
	]);
	await db.package.insert([
		{ id: 1001, lineId: 101, sscc: 'A-1' },
		{ id: 1002, lineId: 101, sscc: 'A-2' },
		{ id: 2001, lineId: 201, sscc: 'C-1' }
	]);
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

	const app = express().use(json()).use('/rdb', db.express({
		orderLine: {
			baseFilter: db.orderLine.amount.lt(250)
		}
	}));
	await new Promise(resolve => {
		server = app.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	httpDb = map.http(`http://127.0.0.1:${address.port}/rdb`);
});

afterAll(async () => {
	if (server)
		await new Promise(resolve => server.close(resolve));
	await db.close();
});

describe('ad-hoc relations', () => {
	test('loads a many and one relation against root scope', async () => {
		const rows = await db.order.getMany({
			orderBy: 'id',
			matchingLines: db.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.id),
				orderBy: 'id',
				packagesForLine: db.package.many({
					where: (pkg, { parent }) => pkg.lineId.eq(parent.id),
					orderBy: 'id'
				})
			}),
			lastMatchingLine: db.orderLine.one({
				where: (line, { root }) => line.orderId.eq(root.id),
				orderBy: 'id desc'
			}),
			orMatchingLines: db.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.id).or(line.id.eq(root.id)),
				orderBy: 'id'
			})
		});

		expect(rows.map(row => row.matchingLines.map(line => line.id))).toEqual([[101, 102], [201, 202]]);
		expect(rows.map(row => row.lastMatchingLine?.id)).toEqual([102, 202]);
		expect(rows.map(row => row.orMatchingLines.map(line => line.id))).toEqual([[101, 102], [201, 202]]);
		expect(rows[0].matchingLines.map(line => line.packagesForLine.map(pkg => pkg.id))).toEqual([[1001, 1002], []]);
	});

	test('supports parent and root scope in a nested strategy', async () => {
		const rows = await db.customer.getMany({
			name: true,
			orderBy: 'id',
			orders: {
				orderDate: true,
				orderBy: 'id',
				affordableLines: db.orderLine.many({
					where: (line, { root, parent }) => line.orderId.eq(parent.id)
						.and(line.amount.lt(root.balance)),
					orderBy: 'id'
				})
			}
		});

		expect(rows.map(row => row.orders[0].affordableLines.map(line => line.id))).toEqual([[101], [201]]);
		expect(rows[0]).not.toHaveProperty('balance');
		expect(rows[0].orders[0]).not.toHaveProperty('id');
	});

	test('applies limit and offset independently per parent', async () => {
		const rows = await db.order.getMany({
			orderBy: 'id',
			secondLine: db.orderLine.many({
				id: true,
				orderId: false,
				where: (line, { root }) => line.orderId.eq(root.id),
				orderBy: 'id',
				offset: 1,
				limit: 1
			})
		});

		expect(rows.map(row => row.secondLine.map(line => line.id))).toEqual([[102], [202]]);
		expect(rows[0].secondLine[0]).not.toHaveProperty('orderId');
	});

	test('batches direct equality correlations across parents', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		try {
			await db.order.getMany({
				orderBy: 'id',
				matchingLines: db.orderLine.many({
					where: (line, { root }) => line.orderId.eq(root.id),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		const targetQueries = queries.filter(sql => /from\s+"?orderline"?/i.test(sql));
		expect(targetQueries).toHaveLength(1);
	});

	test('keeps ad-hoc projections read-only while mapped changes can be saved', async () => {
		const row = await db.order.getOne({
			where: order => order.id.eq(10),
			matchingLines: db.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.id)
			})
		});

		row.matchingLines.length = 0;
		row.orderDate = new Date('2025-01-01T00:00:00Z');
		await row.saveChanges();

		expect(await db.orderLine.count()).toBe(4);
		expect(row.matchingLines).toEqual([]);
		const reloaded = await db.order.getOne({ where: order => order.id.eq(10) });
		expect(new Date(reloaded.orderDate).toISOString()).toBe('2025-01-01T00:00:00.000Z');
		await row.refresh();
		expect(row.matchingLines.map(line => line.id)).toEqual([101, 102]);
	});

	test('preserves ad-hoc projections when an array saves mapped changes', async () => {
		const rows = await db.order.getMany({
			where: order => order.id.eq(20),
			matchingLines: db.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.id),
				orderBy: 'id'
			})
		});

		rows[0].orderDate = new Date('2025-02-01T00:00:00Z');
		await rows.saveChanges();

		expect(rows[0].matchingLines.map(line => line.id)).toEqual([201, 202]);
		await rows.refresh();
		expect(rows[0].matchingLines.map(line => line.id)).toEqual([201, 202]);
	});

	test('supports composite root keys without mapped relation traversal', async () => {
		const rows = await db.compositeOrder.getMany({
			orderBy: ['companyId', 'orderNo'],
			matchingLines: db.compositeOrderLine.many({
				where: (line, { root }) => line.companyId.eq(root.companyId)
					.and(line.orderNo.eq(root.orderNo)),
				orderBy: 'lineNo'
			})
		});

		expect(rows.map(row => row.matchingLines.map(line => line.product))).toEqual([
			['A-1'],
			['A-2'],
			['B-1']
		]);
	});

	test('rejects invalid scope columns, targets, and locking', async () => {
		await expect(db.order.getMany({
			badScope: db.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.missing)
			})
		})).rejects.toThrow('Unknown scope column \'missing\'');

		await expect(db.order.getMany({
			badTarget: db.notMapped.many()
		})).rejects.toThrow('Ad-hoc relation target \'notMapped\' is not mapped or exposed');

		await expect(db.order.getMany({
			locked: db.orderLine.many({ forUpdate: true })
		})).rejects.toThrow('Ad-hoc relations are read-only and cannot use row locking');

		await expect(db.order.getMany({
			id: db.orderLine.many()
		})).rejects.toThrow('conflicts with a mapped or reserved property');
	});

	test('round-trips descriptors and scope references over HTTP', async () => {
		const rows = await httpDb.order.getMany({
			where: order => order.id.eq(10),
			matchingLines: httpDb.orderLine.many({
				where: (line, { root }) => line.orderId.eq(root.id),
				orderBy: 'id'
			})
		});

		// The target table's HTTP baseFilter is applied to ad-hoc reads as well.
		expect(rows[0].matchingLines.map(line => line.id)).toEqual([101]);
	});

	test('chunks owner scope rows without losing attachment identity', async () => {
		const orders = [];
		const lines = [];
		for (let i = 0; i < 101; i++) {
			orders.push({
				id: 1000 + i,
				orderDate: new Date('2024-03-01T00:00:00Z'),
				customerId: 1
			});
			lines.push({
				id: 2000 + i,
				orderId: 1000 + i,
				product: `P${i}`,
				amount: i
			});
		}
		await db.order.insert(orders);
		await db.orderLine.insert(lines);

		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.ge(1000),
				orderBy: 'id',
				matchingLines: db.orderLine.many({
					where: (line, { root }) => line.orderId.eq(root.id),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows).toHaveLength(101);
		expect(rows.every(row => row.matchingLines.length === 1)).toBe(true);
		expect(rows.map(row => row.matchingLines[0].orderId)).toEqual(rows.map(row => row.id));
		expect(queries.filter(sql => /from\s+"?orderline"?/i.test(sql))).toHaveLength(2);
	});
});
