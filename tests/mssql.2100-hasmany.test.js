import { beforeAll, describe, expect, test } from 'vitest';
const map = require('./db');
const initMs = require('./initMs');

const versionArray = process.version.replace('v', '').split('.');
const major = parseInt(versionArray[0]);

describe('mssql getMany hasMany with more than 2100 child rows', () => {
	const connections = {
		mssql: map({
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
		mssqlNative: map({
			db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes', { size: 0 })
		}),
	};

	beforeAll(async () => {
		await createDemoDatabase();
		await initMs(connections.mssql);
		if (major === 18)
			await initMs(connections.mssqlNative);
	}, 30000);

	test('mssql', async () => await verify(connections.mssql, 9000000000000000n, 700000), 60000);
	if (major === 18)
		test('mssqlNative', async () => await verify(connections.mssqlNative, 9000000000010000n, 800000), 60000);

	async function createDemoDatabase() {
		const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
		await connections.mssql.query(sql);
	}

	async function verify(db, baseId, baseFoo) {
		const childCount = 2101;
		const parentValues = [];
		const childValues = [];

		for (let i = 0; i < childCount; i++) {
			const parentId = baseId + BigInt(i);
			parentValues.push(`(${parentId}, ${baseFoo + i})`);
			childValues.push(`(${baseFoo + i}, ${parentId})`);
		}

		await insertRows(db, 'bigintParent', ['id', 'foo'], parentValues);
		await insertRows(db, 'bigintChild', ['bar', 'parentId'], childValues);

		const parentCount = await db.query('select count(*) as count from bigintParent');
		const childCountRows = await db.query('select count(*) as count from bigintChild');

		expect(parentCount[0].count).toEqual(childCount);
		expect(childCountRows[0].count).toEqual(childCount);

		const filter = db.bigintParent.foo.greaterThanOrEqual(baseFoo).and(
			db.bigintParent.foo.lessThan(baseFoo + childCount)
		);
		const rows = await db.bigintParent.getMany(filter, {
			orderBy: 'foo',
			children: {
				orderBy: 'bar',
			},
		});

		expect(rows.length).toEqual(childCount);
		expect(rows.every((row) => row.children.length === 1)).toEqual(true);
		expect(rows[0]).toEqual({
			id: String(baseId),
			foo: baseFoo,
			children: [{
				id: rows[0].children[0].id,
				bar: baseFoo,
				parentId: String(baseId),
			}]
		});
		expect(rows[childCount - 1]).toEqual({
			id: String(baseId + BigInt(childCount - 1)),
			foo: baseFoo + childCount - 1,
			children: [{
				id: rows[childCount - 1].children[0].id,
				bar: baseFoo + childCount - 1,
				parentId: String(baseId + BigInt(childCount - 1)),
			}]
		});
	}
});

async function insertRows(db, tableName, columns, values, chunkSize = 500) {
	for (let i = 0; i < values.length; i += chunkSize) {
		const chunk = values.slice(i, i + chunkSize);
		const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${chunk.join(', ')}`;
		await db.query(sql);
	}
}
