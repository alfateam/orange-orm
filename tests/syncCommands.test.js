import { describe, expect, test } from 'vitest';

const newSyncHandler = require('../src/hostExpress/sync');

describe('sync commands', () => {
	test('replays command handlers inside push transaction', async () => {
		const calls = [];
		const tx = {
			project: {
				patch: async (patch) => {
					calls.push(['patch', patch[0].path]);
					return { changed: [{ id: 1 }] };
				}
			},
			query: async (sql) => {
				calls.push(['query', sql]);
				if (sql.includes('RETURNING result_json'))
					return [{ result_json: null }];
				return [];
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn) => fn(tx),
			query: async () => []
		};
		const handler = newSyncHandler(client, {
			sync: {
				commands: {
					auditProject: async ({ db, args }) => {
						expect(db).toBe(tx);
						calls.push(['command', args[0], args[1].source]);
						await db.query('select 1');
						return { ok: true };
					}
				}
			}
		});
		let jsonResult;
		const response = {
			json(value) {
				jsonResult = value;
			},
			status() {
				return this;
			},
			send(message) {
				throw new Error(message);
			}
		};

		await handler({
			body: {
				phase: 'push',
				clientId: 'client-1',
				mutations: [{
					id: 'mutation-1',
					patches: [{
						table: 'project',
						patch: [{ op: 'replace', path: '/[1]/status', value: 'active' }]
					}],
					commands: [{ name: 'auditProject', args: [1, { source: 'test' }] }]
				}]
			}
		}, response);

		expect(calls.map(x => x[0])).toEqual(['query', 'patch', 'command', 'query', 'query']);
		expect(jsonResult.phase).toBe('push');
		expect(jsonResult.applied).toBe(1);
		expect(jsonResult.results[0].commands).toEqual([
			{ name: 'auditProject', result: { ok: true } }
		]);
	});
});

function newTable(dbName) {
	return {
		_dbName: dbName,
		_columns: [
			{ alias: 'id', _dbName: 'id', tsType: 'NumberColumn', isPrimary: true }
		],
		_primaryColumns: [
			{ alias: 'id', _dbName: 'id', tsType: 'NumberColumn', isPrimary: true }
		],
		_relations: {}
	};
}
