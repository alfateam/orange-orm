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
			options: {
				db: { shouldNotSerialize: true },
				syncTableName: 'project',
				deduceStrategy: false,
				strategy: { owner: {} }
			}
		});

		await adapter.patch(body);
		await adapter.patch(body);

		const ddlStatements = queryLog.filter(sql => sql.includes('CREATE TABLE IF NOT EXISTS "orange_sync_outbox"'));
		expect(ddlStatements).toHaveLength(1);
		const updateStatement = queryLog.find(sql => sql.includes('UPDATE "orange_sync_outbox"'));
		expect(updateStatement).not.toContain('strategy');
		expect(updateStatement).not.toContain('shouldNotSerialize');
		expect(updateStatement).not.toContain('syncTableName');
		expect(updateStatement).not.toContain('deduceStrategy');
	});

	test('captures sync commands in the same outbox payload as patches', async () => {
		const queryLog = [];
		const pool = { __sqliteSync: { url: '/rdb' } };
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
		const transaction = async (fn) => fn(context);
		const table = {
			patch: async () => ({ changed: [] })
		};
		const adapter = hostLocal({
			transaction,
			table,
			syncTableName: 'project'
		});

		await adapter.patch({ patch: [{ op: 'replace', path: '/[1]/name', value: 'New' }], options: {} });
		await adapter.syncCommand({ name: 'auditProject', args: { projectId: 1, source: 'test' } });

		const updateStatement = queryLog.filter(sql => sql.includes('UPDATE "orange_sync_outbox"')).pop();
		expect(updateStatement).toContain('"patches"');
		expect(updateStatement).toContain('"commands"');
		expect(updateStatement).toContain('"name":"auditProject"');
		expect(updateStatement).toContain('"args":{"projectId":1,"source":"test"}');
	});
});
