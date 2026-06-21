import { describe, expect, test } from 'vitest';

const begin = require('../src/table/begin');

describe('transaction begin options', () => {
	test('does not treat ordinary options as transactionLess', async () => {
		const queries = [];
		const context = {
			rdb: {
				begin: 'BEGIN',
				dbClient: {
					executeQuery(query, callback) {
						queries.push(typeof query.sql === 'function' ? query.sql() : query);
						callback(null, []);
					}
				}
			}
		};

		await begin(context, { suppressSyncOutbox: true });

		expect(queries).toEqual(['BEGIN']);
		expect(context.rdb.transactionLess).toBeUndefined();
	});

	test('still supports explicit transactionLess', async () => {
		const queries = [];
		const context = {
			rdb: {
				engine: 'sqlite',
				begin: 'BEGIN',
				dbClient: {
					executeQuery(query, callback) {
						queries.push(typeof query.sql === 'function' ? query.sql() : query);
						callback(null, []);
					}
				}
			}
		};

		await begin(context, { transactionLess: true });

		expect(queries).toEqual([]);
		expect(context.rdb.transactionLess).toBe(true);
	});

	test('begins readonly sqlite transactions', async () => {
		const queries = [];
		const context = {
			rdb: {
				engine: 'sqlite',
				begin: 'BEGIN',
				dbClient: {
					executeQuery(query, callback) {
						queries.push(typeof query.sql === 'function' ? query.sql() : query);
						callback(null, []);
					}
				}
			}
		};

		await begin(context, { readonly: true });

		expect(queries).toEqual(['BEGIN']);
		expect(context.rdb.transactionLess).toBeUndefined();
	});
});
