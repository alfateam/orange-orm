import { describe, test, expect } from 'vitest';
const rdb = require('../src/index');

describe('legacy transaction', () => {

	test('pg', async () => {
		let result;
		const db = rdb('postgres://postgres:postgres@postgres/postgres');
		await db.transaction()
			.then(async () => {
				result = await rdb.query('SELECT 1 as foo');
			})
			.then(rdb.commit)
			.then(null, rdb.rollback);

		expect(result).toEqual([{ foo: 1 }]);

	});

});