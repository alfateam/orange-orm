import { describe, test, afterAll, expect } from 'vitest';
const rdb = require('../src/index');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

const sqliteName = 'demo.getbyid.missing-join-nested-hasmany.test.db';

const map = rdb.map(x => ({
	order: x.table('order_missing_join').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		customerId: column('customer_id').numeric().notNull(),
	})),
	deliveryAddress: x.table('delivery_address_missing_join').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderId: column('order_id').numeric().notNull(),
		label: column('label').string(),
	})),
	deliveryAddressNote: x.table('delivery_address_note_missing_join').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		deliveryAddressId: column('delivery_address_id').numeric().notNull(),
		note: column('note').string(),
	})),
})).map(x => ({
	order: x.order.map(({ hasOne }) => ({
		deliveryAddress: hasOne(x.deliveryAddress).by('orderId'),
	})),
	deliveryAddress: x.deliveryAddress.map(({ hasMany }) => ({
		notes: hasMany(x.deliveryAddressNote).by('deliveryAddressId'),
	})),
}));

const connections = {
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
	},
	mssql: {
		db: map({
			db: (con) => con.mssql({
				server: 'mssql',
				options: {
					encrypt: false,
					database: 'master',
				},
				authentication: {
					type: 'default',
					options: {
						userName: 'sa',
						password: 'P@assword123',
					},
				},
			}, { size: 1 }),
		}),
	},
	mssqlNative: {
		db: map({
			db: (con) => con.mssqlNative(
				'server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes',
				{ size: 0 }
			),
		}),
	},
	pg: {
		db: map({ db: (con) => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
	},
	pglite: {
		db: map({ db: (con) => con.pglite(undefined, { size: 1 }) }),
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
	},
	mariadb: {
		db: map({ db: (con) => con.mariadb('mariadb://test:test@mariadb/test', { size: 1 }) }),
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
	},
	oracle: {
		db: map({
			db: (con) => con.oracle(
				{
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				},
				{ size: 1 }
			),
		}),
	},
};

async function init(db, dbName) {
	const sql = getInitStatements(dbName);

	for (const statement of sql) {
		await db.query(statement);
	}
}

function getInitStatements(dbName) {
	if (dbName === 'mssql' || dbName === 'mssqlNative') {
		return [
			'DROP TABLE IF EXISTS delivery_address_note_missing_join',
			'DROP TABLE IF EXISTS delivery_address_missing_join',
			'DROP TABLE IF EXISTS order_missing_join',
			`CREATE TABLE order_missing_join (
				id INT PRIMARY KEY,
				customer_id INT NOT NULL
			)`,
			`CREATE TABLE delivery_address_missing_join (
				id INT PRIMARY KEY,
				order_id INT NOT NULL,
				label VARCHAR(100)
			)`,
			`CREATE TABLE delivery_address_note_missing_join (
				id INT PRIMARY KEY,
				delivery_address_id INT NOT NULL,
				note VARCHAR(100)
			)`,
		];
	}

	if (dbName === 'pg' || dbName === 'pglite') {
		return [
			'DROP TABLE IF EXISTS "delivery_address_note_missing_join"',
			'DROP TABLE IF EXISTS "delivery_address_missing_join"',
			'DROP TABLE IF EXISTS "order_missing_join"',
			`CREATE TABLE "order_missing_join" (
				"id" INTEGER PRIMARY KEY,
				"customer_id" INTEGER NOT NULL
			)`,
			`CREATE TABLE "delivery_address_missing_join" (
				"id" INTEGER PRIMARY KEY,
				"order_id" INTEGER NOT NULL,
				"label" TEXT
			)`,
			`CREATE TABLE "delivery_address_note_missing_join" (
				"id" INTEGER PRIMARY KEY,
				"delivery_address_id" INTEGER NOT NULL,
				"note" TEXT
			)`,
		];
	}

	if (dbName === 'mysql' || dbName === 'mariadb') {
		return [
			'DROP TABLE IF EXISTS delivery_address_note_missing_join',
			'DROP TABLE IF EXISTS delivery_address_missing_join',
			'DROP TABLE IF EXISTS order_missing_join',
			`CREATE TABLE order_missing_join (
				id INTEGER PRIMARY KEY,
				customer_id INTEGER NOT NULL
			)`,
			`CREATE TABLE delivery_address_missing_join (
				id INTEGER PRIMARY KEY,
				order_id INTEGER NOT NULL,
				label TEXT
			)`,
			`CREATE TABLE delivery_address_note_missing_join (
				id INTEGER PRIMARY KEY,
				delivery_address_id INTEGER NOT NULL,
				note TEXT
			)`,
		];
	}

	if (dbName === 'sqlite') {
		return [
			'DROP TABLE IF EXISTS delivery_address_note_missing_join',
			'DROP TABLE IF EXISTS delivery_address_missing_join',
			'DROP TABLE IF EXISTS order_missing_join',
			`CREATE TABLE order_missing_join (
				id INTEGER PRIMARY KEY,
				customer_id INTEGER NOT NULL
			)`,
			`CREATE TABLE delivery_address_missing_join (
				id INTEGER PRIMARY KEY,
				order_id INTEGER NOT NULL,
				label TEXT
			)`,
			`CREATE TABLE delivery_address_note_missing_join (
				id INTEGER PRIMARY KEY,
				delivery_address_id INTEGER NOT NULL,
				note TEXT
			)`,
		];
	}

	if (dbName === 'sap') {
		return [
			'IF EXISTS (SELECT 1 FROM sysobjects WHERE type = \'U\' AND name = \'delivery_address_note_missing_join\') DROP TABLE delivery_address_note_missing_join',
			'IF EXISTS (SELECT 1 FROM sysobjects WHERE type = \'U\' AND name = \'delivery_address_missing_join\') DROP TABLE delivery_address_missing_join',
			'IF EXISTS (SELECT 1 FROM sysobjects WHERE type = \'U\' AND name = \'order_missing_join\') DROP TABLE order_missing_join',
			`CREATE TABLE order_missing_join (
				id INT PRIMARY KEY,
				customer_id INT NOT NULL
			)`,
			`CREATE TABLE delivery_address_missing_join (
				id INT PRIMARY KEY,
				order_id INT NOT NULL,
				label VARCHAR(100) NULL
			)`,
			`CREATE TABLE delivery_address_note_missing_join (
				id INT PRIMARY KEY,
				delivery_address_id INT NOT NULL,
				note VARCHAR(100) NULL
			)`,
		];
	}

	if (dbName === 'oracle') {
		return [
			'BEGIN EXECUTE IMMEDIATE \'DROP TABLE "delivery_address_note_missing_join"\'; EXCEPTION WHEN OTHERS THEN NULL; END;',
			'BEGIN EXECUTE IMMEDIATE \'DROP TABLE "delivery_address_missing_join"\'; EXCEPTION WHEN OTHERS THEN NULL; END;',
			'BEGIN EXECUTE IMMEDIATE \'DROP TABLE "order_missing_join"\'; EXCEPTION WHEN OTHERS THEN NULL; END;',
			`CREATE TABLE "order_missing_join" (
				"id" NUMBER(10) PRIMARY KEY,
				"customer_id" NUMBER(10) NOT NULL
			)`,
			`CREATE TABLE "delivery_address_missing_join" (
				"id" NUMBER(10) PRIMARY KEY,
				"order_id" NUMBER(10) NOT NULL,
				"label" VARCHAR2(100)
			)`,
			`CREATE TABLE "delivery_address_note_missing_join" (
				"id" NUMBER(10) PRIMARY KEY,
				"delivery_address_id" NUMBER(10) NOT NULL,
				"note" VARCHAR2(100)
			)`,
		];
	}

	throw new Error(`Unsupported dbName ${dbName}`);
}

describe('getById with missing join relation and nested hasMany', () => {
	const cases = [
		['sqlite', connections.sqlite],
		['mssql', connections.mssql],
		...(major === 18 ? [['mssqlNative', connections.mssqlNative]] : []),
		['pg', connections.pg],
		['pglite', connections.pglite],
		['mysql', connections.mysql],
		['mariadb', connections.mariadb],
		['sap', connections.sap],
		['oracle', connections.oracle],
	];

	test.each(cases)('%s: returns null for missing join relation even when nested hasMany is requested', async (dbName, { db }) => {
		await init(db, dbName);
		await db.order.insert({
			id: 1,
			customerId: 10,
		});

		const row = await db.order.getById(1, {
			deliveryAddress: {
				notes: true,
			},
		});

		expect(row.deliveryAddress).toBe(null);
	});
});

afterAll(async () => {
	const closers = Object.values(connections).map(({ db }) => db.close());
	await Promise.allSettled(closers);
});
