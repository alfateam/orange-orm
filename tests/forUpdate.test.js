import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const strategyToSpan = require('../src/table/strategyToSpan');
const newDtoQuery = require('../src/getManyDto/newQuery');
const newRowQuery = require('../src/table/newQuery');
const emptyInnerJoin = require('../src/table/query/newParameterized')();
const emptyFilter = require('../src/emptyFilter');
const pgSelectForUpdateSql = require('../src/pg/selectForUpdateSql');
const mySqlSelectForUpdateSql = require('../src/mySql/selectForUpdateSql');
const mssqlSelectForUpdateSql = require('../src/tedious/selectForUpdateSql');
const pgQuote = require('../src/pg/quote');
const mySqlQuote = require('../src/mySql/quote');
const mssqlQuote = require('../src/tedious/quote');

describe('forUpdate and skipLocked SQL', () => {
	test('postgres locks root and joined aliases for dto queries', () => {
		const { order } = createTables();
		const context = createContext(pgQuote, pgSelectForUpdateSql);
		const span = strategyToSpan(order, {
			forUpdate: true,
			skipLocked: true,
			customer: {
				forUpdate: true
			}
		});

		const sql = newDtoQuery(context, order, emptyFilter, span, order._dbName).sql();

		expect(sql).toContain('FOR UPDATE OF "order", "ordercustomer" SKIP LOCKED');
	});

	test('mysql uses statement-level locking for row queries', () => {
		const { order } = createTables();
		const context = createContext(mySqlQuote, mySqlSelectForUpdateSql);
		const span = strategyToSpan(order, {
			forUpdate: true,
			skipLocked: true
		});

		const [query] = newRowQuery(context, [], order, emptyFilter, span, order._dbName, emptyInnerJoin);

		expect(query.sql()).toContain('FOR UPDATE SKIP LOCKED');
	});

	test('sql server uses table hints on root and joined tables', () => {
		const { order } = createTables();
		const context = createContext(mssqlQuote, mssqlSelectForUpdateSql);
		const span = strategyToSpan(order, {
			forUpdate: true,
			skipLocked: true,
			customer: {
				forUpdate: true
			}
		});

		const sql = newDtoQuery(context, order, emptyFilter, span, order._dbName).sql();

		expect(sql).toContain('[order] [order] WITH (UPDLOCK, READPAST, ROWLOCK)');
		expect(sql).toContain('[customer] [ordercustomer] WITH (UPDLOCK)');
	});

	test('hasMany lock is applied to the child query', () => {
		const { order } = createTables();
		const context = createContext(pgQuote, pgSelectForUpdateSql);
		const span = strategyToSpan(order, {
			lines: {
				forUpdate: true,
				skipLocked: true
			}
		});
		const linesLeg = span.legs.toArray().find(leg => leg.name === 'lines');

		const sql = newDtoQuery(context, linesLeg.span.table, emptyFilter, linesLeg.span, linesLeg.span.table._dbName).sql();

		expect(sql).toContain('FOR UPDATE OF "orderLine" SKIP LOCKED');
	});
});

function createContext(quote, selectForUpdateSql) {
	return {
		rdb: {
			quote,
			selectForUpdateSql
		}
	};
}

function createTables() {
	const customer = rdb.table('customer');
	customer.primaryColumn('id').numeric();
	customer.column('name').string();

	const order = rdb.table('order');
	order.primaryColumn('id').numeric();
	order.column('customerId').numeric();

	const orderLine = rdb.table('orderLine');
	orderLine.primaryColumn('id').numeric();
	orderLine.column('orderId').numeric();
	orderLine.column('product').string();

	order.join(customer).by('customerId').as('customer');
	order.hasMany(orderLine.join(order).by('orderId')).as('lines');

	return { customer, order, orderLine };
}
