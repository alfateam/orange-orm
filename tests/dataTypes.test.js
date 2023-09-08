const express = require('express');
import { json } from 'body-parser';
import cors from 'cors';
const db = require('./db');
import { describe, test, beforeAll, afterAll, expect } from 'vitest';

const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);
let server;

afterAll(async () => {
	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
});

beforeAll(async () => {

	await createMs('mssql');

	await insertData('pg');
	await insertData('mssql');
	if (major > 17)
		await insertData('mssqlNative');
	await insertData('mysql');
	await insertData('sqlite');
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
		const { db }= getDb('sqlite2');
		let app = express();
		app.disable('x-powered-by')
			.use(json({ limit: '100mb' }))
			.use('/rdb', cors(), db.express());
		server = app.listen(3003, () => console.log('Example app listening on port 3000!'));
	}

});


describe('insert-get', () => {
	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	if (major > 17)
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


function getDb(name) {
	if (name === 'mssql')
		return {
			db: db({
				db: (cons) => cons.mssql({
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
				})
			}),
			init: initMs

		};
	else if (name === 'mssqlNative')
		return {
			db: db({ db: (cons) => cons.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes') }),
			init: initMs
		};
	else if (name === 'pg')
		return {
			db: db({ db: (cons) => cons.postgres('postgres://postgres:postgres@postgres/postgres') }),
			init: initPg
		};
	else if (name === 'sqlite')
		return {
			db: db({ db: (cons) => cons.sqlite(sqliteName) }),
			init: initSqlite
		};
	else if (name === 'sqlite2')
		return {
			db: db.sqlite(sqliteName2),
			init: initSqlite
		};
	else if (name === 'sap')
		return {
			db: db.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`),
			init: initSap
		};
	else if (name === 'mysql')
		return {
			db: db.mysql('mysql://test:test@mysql/test'),
			init: initMysql
		};
	else if (name === 'http')
		return {
			db: db.http('http://localhost:3003/rdb'),
		};

	throw new Error('unknown db');
}
const sqliteName = `demo${new Date().getUTCMilliseconds()}.db`;
const sqliteName2 = `demo2${new Date().getUTCMilliseconds()}.db`;
