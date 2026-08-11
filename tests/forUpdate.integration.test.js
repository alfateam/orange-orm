import { describe, expect, test } from 'vitest';
import sqliteTestPath from './sqliteTestPath.mjs';
const map = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initOracle = require('./initOracle');
const initSap = require('./initSap');

const fileNameWithoutExtension = __filename.substring(__dirname.length + 1).slice(0, -3);
const sqliteName = sqliteTestPath(`demo.${fileNameWithoutExtension}.db`);

describe('select for update and skip locked query integration', () => {
	test('pg', async () => await verifyLockingStrategyRuns('pg'));
	test('pglite', async () => await verifyLockingStrategyRuns('pglite'), 20000);
	test('oracle', async () => await verifyLockingStrategyRuns('oracle'));
	test('mssql', async () => await verifyLockingStrategyRuns('mssql'));
	test('mysql', async () => await verifyLockingStrategyRuns('mysql'));
	test('mariadb', async () => await verifyLockingStrategyRuns('mariadb'));
});

describe('select for update unsupported integration', () => {
	test('sqlite throws not supported', async () => await verifyLockingStrategyNotSupported('sqlite', /not supported/));
	test('sap throws not supported', async () => await verifyLockingStrategyNotSupported('sap', /not supported/));
});

describe('select for update write helper integration', () => {
	test('pg', async () => await verifyWriteHelpersUseLockingStrategy('pg'));
	test('pglite', async () => await verifyWriteHelpersUseLockingStrategy('pglite'), 20000);
	test('oracle', async () => await verifyWriteHelpersUseLockingStrategy('oracle'));
	test('mssql', async () => await verifyWriteHelpersUseLockingStrategy('mssql'));
	test('mysql', async () => await verifyWriteHelpersUseLockingStrategy('mysql'));
	test('mariadb', async () => await verifyWriteHelpersUseLockingStrategy('mariadb'));
});

describe('select for update unsupported write helper integration', () => {
	test('sqlite throws not supported', async () => await verifyWriteHelperNotSupported('sqlite', /not supported/));
	test('sap throws not supported', async () => await verifyWriteHelperNotSupported('sap', /not supported/));
});

describe('select for update integration', () => {
	test('pg blocks on locked row', async () => await verifyForUpdateBlocks('pg'));
	test('mssql blocks on locked row', async () => await verifyForUpdateBlocks('mssql'));
	test('mysql blocks on locked row', async () => await verifyForUpdateBlocks('mysql'));
	test('mariadb blocks on locked row', async () => await verifyForUpdateBlocks('mariadb'));
});

describe('skip locked integration', () => {
	test('pg skips locked rows', async () => await verifySkipLocked('pg'));
	test('mssql skips locked rows', async () => await verifySkipLocked('mssql'));
	test('mysql skips locked rows', async () => await verifySkipLocked('mysql'));
	test('mariadb skips locked rows', async () => await verifySkipLocked('mariadb'));
});

async function verifyLockingStrategyRuns(dbName) {
	const { writer, init } = getDbPair(dbName);
	await init(writer);
	const { firstId } = await seedOrders(writer);

	const rows = await writer.transaction(async (db) => {
		return await db.order.getMany({
			where: db.order.id.eq(firstId),
			orderBy: 'id',
			forUpdate: true,
			skipLocked: true,
			lines: {
				orderBy: 'id',
				forUpdate: true,
				skipLocked: true
			}
		});
	});

	expect(rows.length).toEqual(1);
	expect(rows[0].id).toEqual(firstId);
}

async function verifyLockingStrategyNotSupported(dbName, error) {
	const { writer, init } = getDbPair(dbName);
	await init(writer);
	const { firstId } = await seedOrders(writer);

	await expect(writer.transaction(async (db) => {
		await db.order.getMany({
			where: db.order.id.eq(firstId),
			forUpdate: true,
			skipLocked: true
		});
	})).rejects.toThrow(error);
}

async function verifyWriteHelpersUseLockingStrategy(dbName) {
	const { writer, init } = getDbPair(dbName);
	await init(writer);
	const { customerId } = await seedOrders(writer);
	const lockStrategy = {
		forUpdate: true,
		skipLocked: true
	};

	const updated = await writer.customer.update({ name: 'Updated' }, { where: x => x.id.eq(customerId) }, lockStrategy);
	expect(updated[0].name).toEqual('Updated');

	const oldCustomer = await writer.customer.getById(customerId);
	const changedCustomer = { ...oldCustomer, name: 'Changed' };
	const changed = await writer.customer.updateChanges(changedCustomer, oldCustomer, lockStrategy);
	expect(changed.name).toEqual('Changed');

	const replaced = await writer.customer.replace({
		id: customerId,
		name: 'Replaced',
		balance: 188,
		isActive: true
	}, lockStrategy);
	expect(replaced.name).toEqual('Replaced');
}

async function verifyWriteHelperNotSupported(dbName, error) {
	const { writer, init } = getDbPair(dbName);
	await init(writer);
	const { customerId } = await seedOrders(writer);

	await expect(writer.customer.update({ name: 'Updated' }, { where: x => x.id.eq(customerId) }, {
		forUpdate: true,
		skipLocked: true
	})).rejects.toThrow(error);
}

async function verifyForUpdateBlocks(dbName) {
	const { writer, reader, init } = getDbPair(dbName);
	await init(writer);
	const { firstId } = await seedOrders(writer);

	let unlockTx1;
	const holdLock = new Promise((resolve) => {
		unlockTx1 = resolve;
	});

	let lockReady;
	const lockAcquired = new Promise((resolve) => {
		lockReady = resolve;
	});

	const tx1 = writer.transaction(async (db) => {
		await db.order.getMany({
			where: db.order.id.eq(firstId),
			forUpdate: true
		});
		lockReady();
		await holdLock;
	});

	let tx2;
	let rows;
	try {
		await lockAcquired;

		let tx2Finished = false;
		tx2 = reader.transaction(async (db) => {
			const lockRows = await db.order.getMany({
				where: db.order.id.eq(firstId),
				forUpdate: true
			});
			tx2Finished = true;
			return lockRows;
		});

		await delay(250);
		expect(tx2Finished).toEqual(false);

		unlockTx1();
		rows = await withTimeout(tx2, 5000, `Timed out waiting for locked row in ${dbName}`);
	}
	finally {
		unlockTx1();
		await withTimeout(tx1, 5000, `Timed out releasing lock in ${dbName}`);
		if (tx2)
			await withTimeout(tx2, 5000, `Timed out finalizing reader transaction in ${dbName}`);
	}

	expect(rows.length).toEqual(1);
	expect(rows[0].id).toEqual(firstId);
}

async function verifySkipLocked(dbName) {
	const { writer, reader, init } = getDbPair(dbName);
	await init(writer);
	const { firstId, secondId } = await seedOrders(writer);

	let unlockTx1;
	const holdLock = new Promise((resolve) => {
		unlockTx1 = resolve;
	});

	let lockReady;
	const lockAcquired = new Promise((resolve) => {
		lockReady = resolve;
	});

	const tx1 = writer.transaction(async (db) => {
		await db.order.getMany({
			where: db.order.id.eq(firstId),
			forUpdate: true
		});
		lockReady();
		await holdLock;
	});

	let rows;
	try {
		await lockAcquired;
		rows = await withTimeout(reader.transaction(async (db) => {
			return await db.order.getMany({
				orderBy: 'id',
				forUpdate: true,
				skipLocked: true
			});
		}), 5000, `Timed out waiting for skipLocked query in ${dbName}`);
	}
	finally {
		unlockTx1();
		await withTimeout(tx1, 5000, `Timed out releasing lock in ${dbName}`);
	}

	expect(rows.map((x) => x.id)).toEqual([secondId]);
}

async function seedOrders(db) {
	const customer = await db.customer.insert({
		name: 'George',
		balance: 177,
		isActive: true
	});

	const orders = await db.order.insert([
		{
			customer,
			orderDate: new Date(2023, 0, 1, 12, 0, 0)
		},
		{
			customer,
			orderDate: new Date(2023, 0, 2, 12, 0, 0)
		}
	]);

	return {
		customerId: customer.id,
		firstId: orders[0].id,
		secondId: orders[1].id
	};
}

function getDbPair(name) {
	if (name === 'pg') {
		return {
			writer: map({ db: (con) => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
			reader: map({ db: (con) => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) }),
			init: initPg
		};
	}

	if (name === 'pglite') {
		return {
			writer: map({ db: (con) => con.pglite(undefined, { size: 1 }) }),
			reader: map({ db: (con) => con.pglite(undefined, { size: 1 }) }),
			init: initPg
		};
	}

	if (name === 'oracle') {
		return {
			writer: map({
				db: (con) => con.oracle({
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 })
			}),
			reader: map({
				db: (con) => con.oracle({
					user: 'sys',
					password: 'P@assword123',
					connectString: 'oracle/XE',
					privilege: 2
				}, { size: 1 })
			}),
			init: initOracle
		};
	}

	if (name === 'mssql') {
		return {
			writer: map({
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
							password: 'P@assword123'
						}
					}
				}, { size: 1 })
			}),
			reader: map({
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
							password: 'P@assword123'
						}
					}
				}, { size: 1 })
			}),
			init: initMs
		};
	}

	if (name === 'sqlite') {
		return {
			writer: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
			reader: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
			init: initSqlite
		};
	}

	if (name === 'sap') {
		return {
			writer: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
			reader: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 }) }),
			init: initSap
		};
	}

	if (name === 'mysql') {
		return {
			writer: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
			reader: map({ db: (con) => con.mysql('mysql://test:test@mysql/test', { size: 1 }) }),
			init: initMysql
		};
	}

	if (name === 'mariadb') {
		return {
			writer: map({ db: (con) => con.mariadb('mariadb://test:test@mariadb/test', { size: 1 }) }),
			reader: map({ db: (con) => con.mariadb('mariadb://test:test@mariadb/test', { size: 1 }) }),
			init: initMysql
		};
	}

	throw new Error('unknown database: ' + name);
}

async function withTimeout(promise, timeout, message) {
	let timeoutId;
	const timeoutPromise = new Promise((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error(message)), timeout);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	}
	finally {
		clearTimeout(timeoutId);
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
