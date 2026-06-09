import { describe, expect, test } from 'vitest';

const hostLocal = require('../src/hostLocal');

describe('hostLocal sync outbox', () => {
	test('does not rerun outbox DDL for repeated local patches on the same pool', async () => {
		const queryLog = [];
		const pool = { __sqliteSync: { url: '/rdb' } };
		const db = {
			transaction: async (fn) => {
				const context = {
					rdb: {
						poolFactory: pool,
						changes: [],
						cache: {},
						dbClient: {
							executeQuery(query, callback) {
								queryLog.push(query.sql());
								callback(null, []);
							}
						}
					}
				};
				await fn(context);
			}
		};
		const table = {
			patch: async () => ({ changed: [] })
		};
		const adapter = hostLocal({
			db,
			table,
			syncTableName: 'project'
		});
		const body = JSON.stringify({
			patch: [{ op: 'replace', path: '/[1]/name', value: 'New' }],
			options: {}
		});

		await adapter.patch(body);
		await adapter.patch(body);

		const ddlStatements = queryLog.filter(sql => sql.includes('CREATE TABLE IF NOT EXISTS "orange_sync_outbox"'));
		expect(ddlStatements).toHaveLength(1);
	});
});
