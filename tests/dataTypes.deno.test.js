// tests/insert_get_deno.test.js
//
// Deno-native rewrite of the Bun test suite in **pure JS**.
// Uses Deno std BDD + assert, npm: imports for Express stack.
// Run: deno test --allow-net --allow-read --allow-write --allow-env

import rdb from '../dist/index.mjs';
import { describe, it, beforeAll, afterAll } from 'jsr:@std/testing/bdd';
import {  assertObjectMatch   } from 'jsr:@std/assert';
import { dirname, fromFileUrl, join } from 'jsr:@std/path';

// Node/Express deps via npm: (Deno's Node-compat)
import express from 'npm:express@4';
import bodyParser from 'npm:body-parser@1';
import cors from 'npm:cors@2';

// Local modules
import map from './db.mjs';
import initPg from './initPg.js';
import initOracle from './initOracle.js';
import initMs from './initMs.js';
import initMysql from './initMysql.js';
import initSqlite from './initSqlite.js';
import initSap from './initSap.js';

const assertEquals = assertObjectMatch;

// -----------------------------------------------------------------------------
// Environment/setup

const major = 0;
const port = 3005;
let server;

const thisFilePath = fromFileUrl(import.meta.url);
const thisDir = dirname(thisFilePath);

// Replaces fileURLToPath/import.meta.url splitting logic
const fileNameWithoutExtension = (() => {
	const base = thisFilePath.split('/').pop();
	const dot = base.lastIndexOf('.');
	return dot >= 0 ? base.slice(0, dot) : base;
})();

const sqliteName = `demo.${fileNameWithoutExtension}.db`;
const sqliteName2 = `demo.${fileNameWithoutExtension}2.db`;

// -----------------------------------------------------------------------------
// Connection map (unchanged logic; minor Deno path fix for SAP)

const connections = {
	mssql: {
		db: map({
			db: (con) =>
				con.mssql(
					{
						server: 'mssql',
						options: { encrypt: false, database: 'master' },
						authentication: {
							type: 'default',
							options: { userName: 'sa', password: 'P@assword123' },
						},
					},
					{ size: 1 },
				),
		}),
		init: initMs,
	},
	mssqlNative: {
		db: map({
			db: (con) =>
				con.mssqlNative(
					'server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes',
					{ size: 0 },
				),
		}),
		init: initMs,
	},
	pg: {
		db: map({ db: (con) => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg,
	},
	pglite: {
		db: map({ db: (con) => con.pglite(undefined, { size: 1 }) }),
		init: initPg,
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite,
	},
	sqlite2: {
		db: map({ db: (con) => con.sqlite(sqliteName2, { size: 1 }) }),
		init: initSqlite,
	},
	sap: {
		db: map({
			db: (con) =>
				con.sap(
					`Driver=${join(thisDir, 'libsybdrvodb.so')};SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`,
					{ size: 1 },
				),
		}),
		init: initSap,
	},
	oracle: {
		db: map({
			db: (con) =>
				con.oracle(
					{
						user: 'sys',
						password: 'P@assword123',
						connectString: 'oracle/XE',
						privilege: 2,
					},
					{ size: 1 },
				),
		}),
		init: initOracle,
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
		init: initMysql,
	},
	http: {
		db: map.http(`http://localhost:${port}/rdb`),
	},
};

function getDb(name) {
	const c = connections[name];
	if (!c) throw new Error(`unknown connection: ${name}`);
	return c;
}

// -----------------------------------------------------------------------------
// Lifecycle hooks

beforeAll(async () => {
	await insertData('pg');
	await insertData('pglite');
	await insertData('oracle');
	await insertData('mssql');
	if (major === 18) await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
	await insertData('sqlite2');
	hostExpress();

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		if (init) await init(db);
	}

	function hostExpress() {
		const { db } = getDb('sqlite2');
		const app = express();
		app
			.disable('x-powered-by')
			.use(bodyParser.json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express());
		server = app.listen(port, () => {
			console.log(`Example app listening on port ${port}!`);
		});
	}
});

afterAll(async () => {
	await rdb.close();
	await new Promise((resolve, reject) => {
		if (server) {
			server.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		} else {
			resolve();
		}
	});
});


describe('insert-get', () => {
	it('pg', async () => await verify('pg'));
	it('pglite', async () => await verify('pglite'));
	it('oracle', async () => await verify('oracle'));
	it('mssql', async () => await verify('mssql'));
	if (major === 18) it('mssqlNative', async () => await verify('mssqlNative'));
	it('mysql', async () => await verify('mysql'));
	it('sqlite', async () => await verify('sqlite'));
	it('http', { sanitizeResources: false, sanitizeOps: false }, async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		const customer = await db.customer2.insert(
			{
				name: 'Voldemort',
				balance: -200,
				isActive: true,
				data: ['evil', 'magician'],
				picture: 'V/cAIibr+r/2RueTQqUiEw==',
			},
			{ },
		);


		const customer2 = await db.customer2.getOne(undefined, { where: x => x.id.eq(customer.id) });

		const expected = {
			id: 1,
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			data: ['evil', 'magician'],
			picture: 'V/cAIibr+r/2RueTQqUiEw==',
		};

		assertEquals(customer, expected);
		assertEquals(customer2, expected);
	}
});

describe('insert-get bigint', () => {
	it('pg', async () => await verify('pg'));
	it('pglite', async () => await verify('pglite'));
	it('oracle', async () => await verify('oracle'));
	it('mssql', async () => await verify('mssql'));
	if (major === 18) it('mssqlNative', async () => await verify('mssqlNative'));
	it('mysql', async () => await verify('mysql'));
	it('sqlite', async () => await verify('sqlite'));
	it('http', { sanitizeResources: false, sanitizeOps: false }, async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const actual = await db.bigintParent.insert(
			{
				id: '9999999999999999',
				foo: 100,
				children: [{ bar: 1000 }],
			},
			{ children: true },
		);

		const actual2 = await db.bigintParent.getOne(undefined, {
			children: true,
			where: (x) => x.children.bar.eq(1000),
		});

		const expected = {
			id: '9999999999999999',
			foo: 100,
			children: [
				{
					id: '1',
					parentId: '9999999999999999',
					bar: 1000,
				},
			],
		};

		assertEquals(actual, expected);
		assertEquals(actual2, expected);
	}
});
