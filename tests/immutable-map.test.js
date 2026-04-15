import { afterAll, describe, expect, test } from 'vitest';
const rdb = require('../src/index');
const sqliteName = '/tmp/orange-orm-immutable-map.test.db';
const openDbs = [];

afterAll(async () => {
	for (const db of openDbs)
		await db.close();
});

function createSchema() {
	let customer;
	let customerWithEmail;
	const schema = rdb.map(({ table }) => {
		customer = table('customer').map(({ column }) => ({
			id: column('id').numeric().primary().notNullExceptInsert(),
			name: column('name').string()
		}));
		customerWithEmail = customer.map(({ column }) => ({
			email: column('email').string()
		}));
		return {
			customer,
			customerWithEmail
		};
	});
	return { schema, customer, customerWithEmail };
}

describe('immutable map descriptors', () => {
	test('mapping a table returns a new descriptor without changing the base variant', () => {
		const { customer, customerWithEmail } = createSchema();

		expect(customer).not.toBe(customerWithEmail);
		expect(Object.isFrozen(customer)).toBe(true);
		expect(customer._operations.length).toBe(1);
		expect(customerWithEmail._operations.length).toBe(2);
	});

	test('two variants of the same table can be materialized at the same time', () => {
		const { schema } = createSchema();
		const db = schema({ db: {} });

		expect(Object.keys(db.metaData.customer)).toEqual(['id', 'name']);
		expect(Object.keys(db.metaData.customerWithEmail)).toEqual(['id', 'name', 'email']);
	});

	test('provider build creates fresh runtime tables for each db instance', () => {
		const { schema } = createSchema();
		const db1 = schema({ db: {} });
		const db2 = schema({ db: {} });

		expect(db1.tables.customer).not.toBe(db1.tables.customerWithEmail);
		expect(db1.tables.customer).not.toBe(db2.tables.customer);
		expect(db1.tables.customer._columns.map(column => column.alias)).toEqual(['id', 'name']);
		expect(db1.tables.customerWithEmail._columns.map(column => column.alias)).toEqual(['id', 'name', 'email']);
	});

	test('getMany returns the same plain row shape for each materialized variant', async () => {
		const { schema } = createSchema();
		const db = schema({ db: (con) => con.sqlite(sqliteName, { size: 1 }) });
		openDbs.push(db);

		await db.query('DROP TABLE IF EXISTS customer');
		await db.query('CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
		await db.customerWithEmail.insert({ name: 'Ada', email: 'ada@example.test' });

		await expect(db.customer.getMany()).resolves.toEqual([{ id: 1, name: 'Ada' }]);
		await expect(db.customerWithEmail.getMany()).resolves.toEqual([{ id: 1, name: 'Ada', email: 'ada@example.test' }]);
	});
});
