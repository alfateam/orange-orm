import { describe, test, expect, beforeAll } from 'bun:test';
import map from './db.js';
import initSqlite from './initSqlite.js';

const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;

function dateToISOString(date) {
	let tzo = -date.getTimezoneOffset();
	let dif = tzo >= 0 ? '+' : '-';

	function pad(num) {
		let norm = Math.floor(Math.abs(num));
		return (norm < 10 ? '0' : '') + norm;
	}

	function padMilli(d) {
		return (d.getMilliseconds() + '').padStart(3, '0');
	}

	return date.getFullYear() +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		'.' + padMilli(date) +
		dif + pad(tzo / 60) +
		':' + pad(tzo % 60);
}

const connections = {
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: initSqlite,
	},
};

function getDb(name) {
	const c = connections[name];
	if (!c)
		throw new Error(`unknown connection: ${name}`);
	return c;
}

let sqliteFunctionSupported = true;

beforeAll(async () => {
	await insertData('sqlite');
	await detectSqliteFunctionSupport();

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
		if (init)
			await init(db);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});

		const john = await db.customer.insert({
			name: 'Harry',
			balance: 200,
			isActive: true
		});
		const date1 = new Date(2022, 0, 11, 9, 24, 47);
		const date2 = new Date(2021, 0, 11, 12, 22, 45);

		await db.order.insert([
			{
				orderDate: date1,
				customer: george,
				deliveryAddress: {
					name: 'George',
					street: 'Node street 1',
					postalCode: '7059',
					postalPlace: 'Jakobsli',
					countryCode: 'NO'
				},
				lines: [
					{
						product: 'Bicycle',
						amount: 678.90,
						packages: [
							{ sscc: 'aaaa' }
						]
					},
					{
						product: 'Small guitar',
						amount: 123.45,
						packages: [
							{ sscc: 'bbbb' }
						]
					}
				]
			},
			{
				customer: john,
				orderDate: date2,
				deliveryAddress: {
					name: 'Harry Potter',
					street: '4 Privet Drive, Little Whinging',
					postalCode: 'GU4',
					postalPlace: 'Surrey',
					countryCode: 'UK'
				},
				lines: [
					{
						product: 'Magic wand',
						amount: 300,
						packages: [
							{ sscc: '1234' }
						]
					}
				]
			}
		]);
	}

	async function detectSqliteFunctionSupport() {
		const { db } = getDb('sqlite');
		try {
			await db.function('rdb_noop', () => 1);
		} catch (_e) {
			sqliteFunctionSupported = false;
		}
	}
});

describe('wal mode', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		const { db } = getDb(dbName);
		await db.query('PRAGMA journal_mode = WAL');
		await db.query('PRAGMA journal_mode');
		await db.query('ATTACH DATABASE "other.db" AS other');
		await db.query('DROP TABLE IF EXISTS other.orderNote');
		await db.query('CREATE TABLE other.orderNote (id INTEGER PRIMARY KEY, orderId INTEGER, note TEXT)');
		await db.query('INSERT INTO other.orderNote (id, orderId, note) VALUES (1, 2, \'WAL\')');

		const rows = await db.orderNote.getAll({
			where: (note) => note.note.eq('WAL'),
			order: true
		});
		for (let i = 0; i < rows.length; i++) {
			rows[i].order.orderDate = dateToISOString(new Date(rows[i].order.orderDate));
		}

		const date1 = new Date(2021, 0, 11, 12, 22, 45);

		const expected = [
			{
				id: 1,
				orderId: 2,
				note: 'WAL',
				order: {
					id: 2,
					orderDate: dateToISOString(date1),
					customerId: 2
				}
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('sqlite function', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		if (!sqliteFunctionSupported)
			return;
		const { db } = getDb(dbName);

		db.function('add_prefix', (text, prefix) => {
			return `${prefix}${text}`;
		});

		const rows = await db.query('SELECT id, name, add_prefix(name, \'[VIP] \') AS prefixedName FROM customer');

		const expected = [
			{
				id: 1,
				name: 'George',
				prefixedName: '[VIP] George'
			},
			{
				id: 2,
				name: 'Harry',
				prefixedName: '[VIP] Harry'
			}
		];
		expect(rows).toEqual(expected);
	}
});

describe('sqlite function in transaction', () => {
	test('sqlite', async () => await verify('sqlite'));

	async function verify(dbName) {
		if (!sqliteFunctionSupported)
			return;
		const { db } = getDb(dbName);

		await db.transaction(async (db) => {
			db.function('add_prefix', (text, prefix) => {
				return `${prefix}${text}`;
			});

			const rows = await db.query('SELECT id, name, add_prefix(name, \'[VIP] \') AS prefixedName FROM customer');

			const expected = [
				{
					id: 1,
					name: 'George',
					prefixedName: '[VIP] George'
				},
				{
					id: 2,
					name: 'Harry',
					prefixedName: '[VIP] Harry'
				}
			];
			expect(rows).toEqual(expected);
		});
	}
});
