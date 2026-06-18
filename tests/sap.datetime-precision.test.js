import { beforeAll, describe, expect, test } from 'vitest';
const map = require('./db');
const initSap = require('./initSap');

const db = map({
	db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`, { size: 1 })
});

beforeAll(async () => {
	await initSap(db);
}, 60000);

describe('sap datetime precision in optimistic concurrency', () => {
	test('saveChanges matches old datetime values even when the stored value has milliseconds', async () => {
		const row = await db.datetest.getOne();

		expect(row).toEqual({
			id: 1,
			date: '2023-07-14T00:00:00',
			datetime: '2023-07-14T12:00:00'
		});

		row.datetime = null;
		await row.saveChanges();
		await row.refresh();

		expect(row).toEqual({
			id: 1,
			date: '2023-07-14T00:00:00',
			datetime: null
		});
	}, 60000);
});
