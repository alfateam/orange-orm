import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { fileURLToPath } from 'url';
import setupD1 from './setupD1';
const express = require('express');
const map = require('./db');
import { json } from 'body-parser';
import cors from 'cors';

const initPg = require('./initPg');
const initOracle = require('./initOracle');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
const port = 3005;
let server;
let d1;
let miniflare;

afterAll(async () => {
	await miniflare.dispose();
	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
});

beforeAll(async () => {
	({ d1, miniflare } = await setupD1(fileURLToPath(import.meta.url)));
	await createMs('mssql');
	await insertData('pg');
	await insertData('oracle');
	await insertData('mssql');
	if (major === 18)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
	await insertData('d1');
	await insertData('sqlite2');
	await insertData('sap');
	hostExpress();

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		await init(db);
	}


	async function createMs(dbName) {
		const { db } = getDb(dbName);
		const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
		await db.query(sql);
	}

	function hostExpress() {
		const { db } = getDb('sqlite2');
		let app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express());
		server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
	}

});


describe('insert-get', () => {
	test('pg', async () => await verify('pg'));
	test('oracle', async () => await verify('oracle'));
	test('mssql', async () => await verify('mssql'));
	if (major === 18)
		test('mssqlNative', async () => await verify('mssqlNative'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));

	async function verify(dbName) {
		const { db } = getDb(dbName);

		const customer = await db.customer2.insert({
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			data: ['evil', 'magician'],
			picture: 'V/cAIibr+r/2RueTQqUiEw=='
		});

		const expected = {
			id: 1,
			name: 'Voldemort',
			balance: -200,
			isActive: true,
			data: ['evil', 'magician'],
			picture: 'V/cAIibr+r/2RueTQqUiEw=='
		};

		expect(customer).toEqual(expected);
	}
});

const pathSegments = fileURLToPath(import.meta.url).split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;
const sqliteName2 = `demo.${fileNameWithoutExtension}2.db`;

const connections = {
	mssql: {
		db:
			map({
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
			},),
		init: initMs
	},
	mssqlNative:
	{
		db: map({ db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes', { size: 0 }) }),
		init: initMs
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
		init: initPg
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite
	},
	d1: {
		db: map({ db: (con) => con.d1(d1, { size: 1 }) }),
		init: initSqlite
	},
	sqlite2: {
		db: map({ db: (con) => con.sqlite(sqliteName2, { size: 1 }) }),
		init: initSqlite
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
		init: initSap
	},
	oracle: {
		db: map({
			db: (con) => con.oracle(
				{
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 }

			)
		}),
		init: initOracle
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
		init: initMysql
	},
	http: {
		db: map.http(`http://localhost:${port}/rdb`),
	}

};

function getDb(name) {
	if (name === 'mssql')
		return connections.mssql;
	else if (name === 'mssqlNative')
		return connections.mssqlNative;
	else if (name === 'pg')
		return connections.pg;
	else if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'd1')
		return connections.d1;
	else if (name === 'sqlite2')
		return connections.sqlite2;
	else if (name === 'sap')
		return connections.sap;
	else if (name === 'oracle')
		return connections.oracle;
	else if (name === 'mysql')
		return connections.mysql;
	else if (name === 'http')
		return connections.http;
	else
		throw new Error('unknown');
}
