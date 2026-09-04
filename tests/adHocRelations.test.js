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
		{ id: 2001, lineId: 201, sscc: 'C-1' },
		{ id: 2002, lineId: 201, sscc: 'C-2' }
	]);
	await db.compositeOrder.insert([
		{ companyId: 'A', orderNo: 1 },
		{ companyId: 'A', orderNo: 2 },
		{ companyId: 'B', orderNo: 1 }
	]);
	await db.compositeOrderLine.insert([
		{ companyId: 'A', orderNo: 1, lineNo: 1, product: 'A-1' },
		{ companyId: 'A', orderNo: 1, lineNo: 2, product: 'A-1b' },
		{ companyId: 'A', orderNo: 2, lineNo: 1, product: 'A-2' },
		{ companyId: 'A', orderNo: 2, lineNo: 2, product: 'A-2b' },
		{ companyId: 'B', orderNo: 1, lineNo: 1, product: 'B-1' },
		{ companyId: 'B', orderNo: 1, lineNo: 2, product: 'B-1b' }
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
			customerName: order => order.customer.name,
			matchingLines: (order, { db }) => db.orderLine.many({
				where: line => line.orderId.eq(order.id),
				orderBy: 'id',
				orderId: false,
				packagesForLine: (line, { db }) => db.package.many({
					where: pkg => pkg.lineId.eq(line.id)
						.and(line.orderId.eq(order.id)),
					orderBy: 'id'
				})
			}),
			lastMatchingLine: (_, { db, root }) => db.orderLine.one({
				where: line => line.orderId.eq(root.id),
				orderBy: 'id desc'
			}),
			orMatchingLines: (_, { db, root }) => db.orderLine.many({
				where: line => line.orderId.eq(root.id).or(line.id.eq(root.id)),
				orderBy: 'id'
			})
		});

		expect(rows.map(row => row.matchingLines.map(line => line.id))).toEqual([[101, 102], [201, 202]]);
		expect(rows.map(row => row.customerName)).toEqual(['One', 'Two']);
		expect(rows.map(row => row.lastMatchingLine?.id)).toEqual([102, 202]);
		expect(rows.map(row => row.orMatchingLines.map(line => line.id))).toEqual([[101, 102], [201, 202]]);
		expect(rows[0].matchingLines.map(line => line.packagesForLine.map(pkg => pkg.id))).toEqual([[1001, 1002], []]);
		expect(rows[0].matchingLines[0]).not.toHaveProperty('orderId');
	});

	test('supports current and root scope in a nested strategy', async () => {
		const rows = await db.customer.getMany({
			name: true,
			orderBy: 'id',
			orders: {
				orderDate: true,
				orderBy: 'id',
				affordableLines: (order, { db, root }) => db.orderLine.many({
					where: line => line.orderId.eq(order.id)
						.and(line.amount.lt(root.balance)),
					orderBy: 'id'
				})
			}
		});

		expect(rows.map(row => row.orders[0].affordableLines.map(line => line.id))).toEqual([[101], [201]]);
		expect(rows[0]).not.toHaveProperty('balance');
		expect(rows[0].orders[0]).toHaveProperty('id', 10);
	});

	test('uses ordinary relation filters on root and current scope in one batch', async () => {
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.customer.getMany({
				name: true,
				orderBy: 'id',
				orders: {
					orderBy: 'id',
					matchingLines: (order, { db, root }) => db.orderLine.many({
						where: line => line.orderId.eq(order.id)
							.and(order.customer.name.eq(root.name))
							.and(root.orders.any(relatedOrder => relatedOrder.id.eq(order.id)))
							.and(line.amount.lt(order.customer.balance)),
						orderBy: 'id'
					})
				}
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.orders[0].matchingLines.map(line => line.id))).toEqual([[101], [201]]);
		expect(queries.filter(isOrderLineSelect)).toHaveLength(1);
	});

	test('paginates mapped many relations independently per parent', async () => {
		const firstRows = await db.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: {
				id: true,
				orderId: false,
				limit: 1
			}
		});

		expect(firstRows.map(row => row.lines.map(line => line.id))).toEqual([[101], [201]]);

		const secondRows = await db.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: {
				id: true,
				orderId: false,
				orderBy: 'id',
				offset: 1,
				limit: 1
			}
		});

		expect(secondRows.map(row => row.lines.map(line => line.id))).toEqual([[102], [202]]);

		const filteredRows = await db.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: {
				where: line => line.amount.lt(200),
				orderBy: 'id desc',
				limit: 1
			}
		});
		expect(filteredRows.map(row => row.lines.map(line => line.id))).toEqual([[101], [202]]);

		const emptyRows = await db.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: { limit: 0 }
		});
		expect(emptyRows.map(row => row.lines)).toEqual([[], []]);
	});

	test('tracks paginated mapped children when their keys are not selected', async () => {
		const rows = await db.order.getMany({
			where: order => order.id.eq(10),
			lines: {
				product: true,
				orderId: false,
				orderBy: 'id',
				limit: 1
			}
		});
		const originalProduct = rows[0].lines[0].product;
		rows[0].lines[0].product = 'Tracked through hidden key';
		try {
			await rows.saveChanges();
			const saved = await db.orderLine.getById(101);
			expect(saved.product).toBe('Tracked through hidden key');
		}
		finally {
			const saved = await db.orderLine.getById(101);
			saved.product = originalProduct;
			await saved.saveChanges();
		}
	});

	test('paginates nested and composite mapped many relations per parent', async () => {
		const orders = await db.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: {
				orderBy: 'id',
				limit: 1,
				packages: {
					orderBy: 'id',
					offset: 1,
					limit: 1
				}
			}
		});

		expect(orders.map(order => order.lines[0].packages.map(pkg => pkg.id))).toEqual([
			[1002],
			[2002]
		]);

		const compositeOrders = await db.compositeOrder.getMany({
			orderBy: ['companyId', 'orderNo'],
			lines: {
				orderBy: 'lineNo',
				offset: 1,
				limit: 1
			}
		});

		expect(compositeOrders.map(order => order.lines.map(line => line.product))).toEqual([
			['A-1b'],
			['A-2b'],
			['B-1b']
		]);
	});

	test('applies limit and offset independently per parent', async () => {
		const rows = await db.order.getMany({
			orderBy: 'id',
			secondLine: (_, { db, root }) => db.orderLine.many({
				id: true,
				orderId: false,
				where: line => line.orderId.eq(root.id),
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
				matchingLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.orderId.eq(root.id),
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

	test('refreshes read-only ad-hoc projections when mapped changes are saved', async () => {
		const row = await db.order.getOne({
			where: order => order.id.eq(10),
			matchingLines: (_, { db, root }) => db.orderLine.many({
				where: line => line.orderId.eq(root.id)
			})
		});

		row.matchingLines.length = 0;
		row.orderDate = new Date('2025-01-01T00:00:00Z');
		await row.saveChanges();

		expect(await db.orderLine.count()).toBe(4);
		expect(row.matchingLines.map(line => line.id)).toEqual([101, 102]);
		const reloaded = await db.order.getOne({ where: order => order.id.eq(10) });
		expect(new Date(reloaded.orderDate).toISOString()).toBe('2025-01-01T00:00:00.000Z');
	});

	test('refreshes ad-hoc projections when an array saves mapped changes', async () => {
		const rows = await db.order.getMany({
			orderBy: 'id',
			matchingLines: (_, { db, root }) => db.orderLine.many({
				where: line => line.orderId.eq(root.id),
				orderBy: 'id'
			})
		});

		for (let i = 0; i < rows.length; i++) {
			rows[i].matchingLines.length = 0;
			rows[i].orderDate = new Date(`2025-02-0${i + 1}T00:00:00Z`);
		}
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		try {
			await rows.saveChanges();
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows.map(row => row.matchingLines.map(line => line.id))).toEqual([[101, 102], [201, 202]]);
		expect(queries.filter(isOrderLineSelect)).toHaveLength(1);
	});

	test('refreshes ad-hoc projections after save over HTTP', async () => {
		const row = await httpDb.order.getOne({
			where: order => order.id.eq(10),
			matchingLines: (_, { db, root }) => db.orderLine.many({
				where: line => line.orderId.eq(root.id),
				orderBy: 'id'
			})
		});

		row.matchingLines.length = 0;
		row.orderDate = new Date('2025-03-01T00:00:00Z');
		await row.saveChanges();

		expect(row.matchingLines.map(line => line.id)).toEqual([101]);
	});

	test('supports composite root keys without mapped relation traversal', async () => {
		const rows = await db.compositeOrder.getMany({
			orderBy: ['companyId', 'orderNo'],
			matchingLines: (_, { db, root }) => db.compositeOrderLine.many({
				where: line => line.companyId.eq(root.companyId)
					.and(line.orderNo.eq(root.orderNo)),
				orderBy: 'lineNo'
			}),
			relationFilteredLines: (_, { db, root }) => db.compositeOrderLine.many({
				where: line => line.companyId.eq(root.companyId)
					.and(line.orderNo.eq(root.orderNo))
					.and(root.lines.any(related => related.product.eq('A-1'))),
				orderBy: 'lineNo'
			})
		});

		expect(rows.map(row => row.matchingLines.map(line => line.product))).toEqual([
			['A-1', 'A-1b'],
			['A-2', 'A-2b'],
			['B-1', 'B-1b']
		]);
		expect(rows.map(row => row.relationFilteredLines.map(line => line.product))).toEqual([
			['A-1', 'A-1b'],
			[],
			[]
		]);
	});

	test('rejects invalid scope columns, targets, and locking', async () => {
		await expect(db.order.getMany({
			directDescriptor: db.orderLine.many()
		})).rejects.toThrow('Ad-hoc relations must be returned by a fetch strategy function');

		await expect(db.order.getMany({
			badScope: (_, { db, root }) => db.orderLine.many({
				where: line => line.orderId.eq(root.missing)
			})
		})).rejects.toThrow('Unknown scope column \'missing\'');

		await expect(db.order.getMany({
			badTarget: (_, { db }) => db.notMapped.many()
		})).rejects.toThrow('Ad-hoc relation target \'notMapped\' is not mapped or exposed');

		await expect(db.order.getMany({
			locked: (_, { db }) => db.orderLine.many({ forUpdate: true })
		})).rejects.toThrow('Ad-hoc relations are read-only and cannot use row locking');

		await expect(db.order.getMany({
			id: (_, { db }) => db.orderLine.many()
		})).rejects.toThrow('conflicts with a mapped or reserved property');
	});

	test('rejects unsafe pagination before it can reach SQL', async () => {
		const injection = '1; DROP TABLE customer; --';
		const invalidValues = [injection, -1, 1.5, Number.MAX_SAFE_INTEGER + 1];

		for (const value of invalidValues) {
			await expect(db.order.getMany({ limit: value }))
				.rejects.toThrow('Invalid limit');
			await expect(db.order.getMany({ offset: value }))
				.rejects.toThrow('Invalid offset');
		}
		await expect(db.order.getMany({
			offset: Number.MAX_SAFE_INTEGER,
			limit: 1
		})).rejects.toThrow('Invalid pagination range');

		await expect(db.order.getMany({
			lines: { limit: injection }
		})).rejects.toThrow('Invalid limit');

		await expect(db.order.getMany({
			matchingLines: (order, { db }) => db.orderLine.many({
				where: line => line.orderId.eq(order.id),
				limit: injection
			})
		})).rejects.toThrow('Invalid limit');

		await expect(httpDb.order.getMany({ limit: injection }))
			.rejects.toThrow('Invalid limit');
		await expect(httpDb.order.getMany({
			matchingLines: (order, { db }) => db.orderLine.many({
				where: line => line.orderId.eq(order.id),
				offset: injection
			})
		})).rejects.toThrow('Invalid offset');
		await expect(db.db.transaction(context => map.order.getMany(
			context,
			orange.filter,
			{ limit: injection }
		))).rejects.toThrow('Invalid limit');

		const customers = await db.customer.getMany({ limit: 1 });
		expect(customers).toHaveLength(1);
	});

	test('rejects unsafe orderBy fragments in the low-level query path', async () => {
		await expect(db.db.transaction(context => map.order.getMany(
			context,
			orange.filter,
			{ orderBy: 'id desc;DROP TABLE customer' }
		))).rejects.toThrow('Unable to get column on orderBy');

		await expect(db.db.transaction(context => map.customer2.getMany(
			context,
			orange.filter,
			{ orderBy: 'data->>\'name\';DROP TABLE customer;--' }
		))).rejects.toThrow('Unable to get column on orderBy');
		const jsonOrdered = await db.db.transaction(context => map.customer2.getMany(
			context,
			orange.filter,
			{ orderBy: 'data->>\'name\'' }
		));
		expect(jsonOrdered).not.toHaveLength(0);

		const customers = await db.customer.getMany({ limit: 1 });
		expect(customers).toHaveLength(1);
	});

	test('round-trips descriptors and scope references over HTTP', async () => {
		const rows = await httpDb.order.getMany({
			where: order => order.id.eq(10),
			matchingLines: (order, { db }) => db.orderLine.many({
				where: line => line.orderId.eq(order.id)
					.and(order.customer.name.eq('One')),
				orderBy: 'id',
				packagesForLine: (line, { db }) => db.package.many({
					where: pkg => pkg.lineId.eq(line.id)
						.and(line.orderId.eq(order.id)),
					orderBy: 'id'
				})
			})
		});

		// The target table's HTTP baseFilter is applied to ad-hoc reads as well.
		expect(rows[0].matchingLines.map(line => line.id)).toEqual([101]);
		expect(rows[0].matchingLines[0].packagesForLine.map(pkg => pkg.id)).toEqual([1001, 1002]);

		const mappedRows = await httpDb.order.getMany({
			where: order => order.id.in([10, 20]),
			orderBy: 'id',
			lines: {
				orderBy: 'id',
				limit: 1
			}
		});
		expect(mappedRows.map(row => row.lines.map(line => line.id))).toEqual([[101], [201]]);
	});

	test('chunks 205 unique scope tuples without losing attachment identity', async () => {
		const fixture = await getScopeBatchFixture();
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orderIds),
				orderBy: 'id',
				matchingLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.orderId.eq(root.id),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows).toHaveLength(205);
		expect(rows.every(row => row.matchingLines.length === 1)).toBe(true);
		expect(rows.map(row => row.matchingLines[0].orderId)).toEqual(rows.map(row => row.id));
		expect(queries.filter(isOrderLineSelect)).toHaveLength(3);

		queries.length = 0;
		orange.on('query', onQuery);
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orderIds),
				orderBy: 'id',
				lines: {
					orderBy: 'id',
					limit: 1
				}
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(rows).toHaveLength(205);
		expect(rows.every(row => row.lines.length === 1)).toBe(true);
		expect(rows.map(row => row.lines[0].orderId)).toEqual(rows.map(row => row.id));
		expect(queries.filter(isOrderLineSelect)).toHaveLength(3);
	});

	test('deduplicates 205 identical scopes and deep-clones nested results per owner', async () => {
		const fixture = await getScopeBatchFixture();
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orderIds),
				orderBy: 'id',
				matchingLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.amount.eq(root.customerId),
					orderBy: 'id',
					packagesForLine: (line, { db }) => db.package.many({
						where: pkg => pkg.lineId.eq(line.id),
						orderBy: 'id'
					})
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(queries.filter(isOrderLineSelect)).toHaveLength(1);
		expect(rows).toHaveLength(205);
		expect(rows.every(row => row.matchingLines.map(line => line.id).join(',') === '101,2099')).toBe(true);
		expect(rows[0].matchingLines).not.toBe(rows[1].matchingLines);
		expect(rows[0].matchingLines[0]).not.toBe(rows[1].matchingLines[0]);
		expect(rows[0].matchingLines[0].packagesForLine).not.toBe(rows[1].matchingLines[0].packagesForLine);
		expect(rows[0].matchingLines[0].packagesForLine[0]).not.toBe(rows[1].matchingLines[0].packagesForLine[0]);

		rows[0].matchingLines.pop();
		rows[0].matchingLines[0].packagesForLine[0].sscc = 'changed';
		expect(rows[1].matchingLines).toHaveLength(2);
		expect(rows[1].matchingLines[0].packagesForLine[0].sscc).toBe('A-1');
	});

	test('paginates many and one once per identical scope before cloning', async () => {
		const fixture = await getScopeBatchFixture();
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orderIds),
				orderBy: 'id',
				pagedLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.amount.ge(root.customerId),
					orderBy: 'id',
					offset: 1,
					limit: 1
				}),
				firstLine: (_, { db, root }) => db.orderLine.one({
					where: line => line.amount.ge(root.customerId),
					orderBy: 'id'
				})
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		expect(queries.filter(isOrderLineSelect)).toHaveLength(2);
		expect(rows.every(row => row.pagedLines.length === 1 && row.pagedLines[0].id === 102)).toBe(true);
		expect(rows.every(row => row.firstLine.id === 101)).toBe(true);
		expect(rows[0].pagedLines).not.toBe(rows[1].pagedLines);
		expect(rows[0].pagedLines[0]).not.toBe(rows[1].pagedLines[0]);
		expect(rows[0].firstLine).not.toBe(rows[1].firstLine);
	});

	test('deduplicates normalized dates for a non-equality scope filter', async () => {
		const fixture = await getScopeBatchFixture();
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.order.getMany({
				where: order => order.id.in(fixture.orderIds),
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

		const targetQueries = queries.filter(isDateTestSelect);
		expect(targetQueries).toHaveLength(1);
		expect(scopeRowCount(targetQueries[0])).toBe(1);
		expect(rows.every(row => row.earlierDates.length === 1 && row.earlierDates[0].id === 1)).toBe(true);
	});

	test('separates partially matching root and current tuples', async () => {
		const fixture = await getCompositeScopeFixture();
		const queries = [];
		const onQuery = query => queries.push(query.sql);
		orange.on('query', onQuery);
		let rows;
		try {
			rows = await db.customer.getMany({
				where: customer => customer.id.in(fixture.customerIds),
				orderBy: 'id',
				orders: {
					orderBy: 'id',
					dateMatches: (order, { db, root }) => db.datetest.many({
						where: dateRow => dateRow.id.lt(root.balance)
							.and(dateRow.datetime.lt(order.orderDate)),
						orderBy: 'id'
					})
				}
			});
		}
		finally {
			orange.off('query', onQuery);
		}

		const targetQueries = queries.filter(isDateTestSelect);
		const attached = rows.flatMap(row => row.orders.map(order => order.dateMatches.map(dateRow => dateRow.id)));
		expect(attached).toEqual([[1], [1], [1], [1]]);
		expect(targetQueries).toHaveLength(1);
		expect(scopeRowCount(targetQueries[0])).toBe(3);
	});

	test('keeps no-scope and per-parent fallback query counts unchanged', async () => {
		const fixture = await getScopeBatchFixture();
		const ownerIds = fixture.orderIds.slice(0, 2);
		const noScopeQueries = [];
		const onNoScopeQuery = query => noScopeQueries.push(query.sql);
		orange.on('query', onNoScopeQuery);
		let noScopeRows;
		try {
			noScopeRows = await db.order.getMany({
				where: order => order.id.in(ownerIds),
				orderBy: 'id',
				fixedPackages: (_, { db }) => db.package.many({
					where: pkg => pkg.id.eq(1001)
				})
			});
		}
		finally {
			orange.off('query', onNoScopeQuery);
		}

		expect(noScopeQueries.filter(isPackageSelect)).toHaveLength(1);
		expect(noScopeRows.map(row => row.fixedPackages.map(pkg => pkg.id))).toEqual([[1001], [1001]]);
		expect(noScopeRows[0].fixedPackages).not.toBe(noScopeRows[1].fixedPackages);
		expect(noScopeRows[0].fixedPackages[0]).not.toBe(noScopeRows[1].fixedPackages[0]);

		const fallbackQueries = [];
		const onFallbackQuery = query => fallbackQueries.push(query.sql);
		orange.on('query', onFallbackQuery);
		let fallbackRows;
		try {
			fallbackRows = await db.order.getMany({
				where: order => order.id.in(ownerIds),
				orderBy: 'id',
				matchingLines: (_, { db, root }) => db.orderLine.many({
					where: line => line.amount.eq(root.customerId),
					order: {
						where: order => order.customerId.eq(root.customerId)
					}
				})
			});
		}
		finally {
			orange.off('query', onFallbackQuery);
		}

		expect(fallbackQueries.filter(isOrderLineSelect)).toHaveLength(2);
		expect(fallbackRows.map(row => row.matchingLines.map(line => line.id))).toEqual([
			[101, 2099],
			[101, 2099]
		]);
	});
});

let scopeBatchFixturePromise;

function getScopeBatchFixture() {
	if (!scopeBatchFixturePromise)
		scopeBatchFixturePromise = insertScopeBatchFixture();
	return scopeBatchFixturePromise;
}

async function insertScopeBatchFixture() {
	await db.customer.insert({ id: 100, name: 'Batch', balance: 100, isActive: true });
	const orders = [];
	const lines = [];
	for (let i = 0; i < 205; i++) {
		orders.push({
			id: 1000 + i,
			orderDate: new Date('2024-03-01T00:00:00Z'),
			customerId: 100
		});
		lines.push({
			id: 2000 + i,
			orderId: 1000 + i,
			product: `P${i}`,
			amount: i + 1
		});
	}
	await db.order.insert(orders);
	await db.orderLine.insert(lines);
	return { orderIds: orders.map(order => order.id) };
}

let compositeScopeFixturePromise;

function getCompositeScopeFixture() {
	if (!compositeScopeFixturePromise)
		compositeScopeFixturePromise = insertCompositeScopeFixture();
	return compositeScopeFixturePromise;
}

async function insertCompositeScopeFixture() {
	const customers = [
		{ id: 300, name: 'Tuple A', balance: 100, isActive: true },
		{ id: 301, name: 'Tuple B', balance: 200, isActive: true }
	];
	await db.customer.insert(customers);
	await db.order.insert([
		{ id: 3000, orderDate: new Date('2024-04-01T00:00:00Z'), customerId: 300 },
		{ id: 3001, orderDate: new Date('2024-04-01T00:00:00Z'), customerId: 300 },
		{ id: 3002, orderDate: new Date('2024-04-02T00:00:00Z'), customerId: 300 },
		{ id: 3003, orderDate: new Date('2024-04-01T00:00:00Z'), customerId: 301 }
	]);
	return { customerIds: customers.map(customer => customer.id) };
}

function isOrderLineSelect(sql) {
	return /\bfrom\s+"?orderline"?/i.test(sql);
}

function isDateTestSelect(sql) {
	return /\bfrom\s+"?datetest"?/i.test(sql);
}

function isPackageSelect(sql) {
	return /\bfrom\s+"?package"?/i.test(sql);
}

function scopeRowCount(sql) {
	return (sql.match(/\bunion\s+all\b/gi) || []).length + 1;
}
