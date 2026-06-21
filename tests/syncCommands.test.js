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
					auditProject: async (db, args) => {
						expect(db).toBe(tx);
						calls.push(['command', args.projectId, args.source]);
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
					commands: [{ name: 'auditProject', args: { projectId: 1, source: 'test' } }]
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

	test('runs transaction hooks for sync row fetch', async () => {
		const calls = [];
		const transactionOptions = [];
		const tx = {
			project: {
				getMany: async (filter) => {
					calls.push(['getMany', filter.parameters[0]]);
					return [{ id: 1, name: 'Project 1' }];
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn, options) => {
				transactionOptions.push(options);
				return fn(tx);
			},
			query: async () => []
		};
		const handler = newSyncHandler(client, {
			hooks: newHooks(calls),
			sync: {}
		});

		const jsonResult = await callHandler(handler, {
			phase: 'rows',
			items: [{ table: 'project', pk: [1], op: 'U' }]
		});

		expect(calls.map(x => x[0])).toEqual([
			'beforeBegin',
			'afterBegin',
			'getMany',
			'beforeCommit',
			'afterCommit'
		]);
		expect(transactionOptions).toEqual([{ readonly: true }]);
		expect(jsonResult.items).toEqual([
			{ table: 'project', pk: [1], key: { id: 1 }, row: { id: 1, name: 'Project 1' }, op: 'U' }
		]);
	});

	test('runs transaction hooks for sync snapshot key fetch', async () => {
		const calls = [];
		const transactionOptions = [];
		const tx = {
			project: {
				getMany: async (_filter, strategy) => {
					calls.push(['getMany', strategy.orderBy[0]]);
					return [{ id: 1 }];
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn, options) => {
				transactionOptions.push(options);
				return fn(tx);
			},
			query: async () => [{ min_id: 1, max_id: 1 }]
		};
		const handler = newSyncHandler(client, {
			hooks: newHooks(calls),
			sync: {}
		});

		const jsonResult = await callHandler(handler, {
			phase: 'keys',
			tables: ['project']
		});

		expect(calls.map(x => x[0])).toEqual([
			'beforeBegin',
			'afterBegin',
			'getMany',
			'beforeCommit',
			'afterCommit'
		]);
		expect(transactionOptions).toEqual([{ readonly: true }]);
		expect(jsonResult.mode).toBe('snapshot');
		expect(jsonResult.items).toEqual([
			{ table: 'project', pk: [1], key: { id: 1 }, op: 'U' }
		]);
	});

	test('runs transaction hooks for sync push apply', async () => {
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
			hooks: newHooks(calls),
			sync: {}
		});

		const jsonResult = await callHandler(handler, {
			phase: 'push',
			clientId: 'client-1',
			mutations: [{
				id: 'mutation-1',
				patches: [{
					table: 'project',
					patch: [{ op: 'replace', path: '/[1]/name', value: 'Project 1' }]
				}]
			}]
		});

		expect(calls.map(x => x[0])).toEqual([
			'beforeBegin',
			'afterBegin',
			'query',
			'patch',
			'query',
			'beforeCommit',
			'afterCommit'
		]);
		expect(jsonResult.phase).toBe('push');
		expect(jsonResult.applied).toBe(1);
	});
});

function newHooks(calls) {
	return {
		transaction: {
			beforeBegin: async (db, req, res) => {
				expect(db).toBeTruthy();
				expect(req.headers.authorization).toBe('Bearer test');
				expect(typeof res.json).toBe('function');
				calls.push(['beforeBegin']);
			},
			afterBegin: async (db, req, res) => {
				expect(db).toBeTruthy();
				expect(req.headers.authorization).toBe('Bearer test');
				expect(typeof res.json).toBe('function');
				calls.push(['afterBegin']);
			},
			beforeCommit: async (db, req, res) => {
				expect(db).toBeTruthy();
				expect(req.headers.authorization).toBe('Bearer test');
				expect(typeof res.json).toBe('function');
				calls.push(['beforeCommit']);
			},
			afterCommit: async (db, req, res) => {
				expect(db).toBeTruthy();
				expect(req.headers.authorization).toBe('Bearer test');
				expect(typeof res.json).toBe('function');
				calls.push(['afterCommit']);
			},
			afterRollback: async () => {
				calls.push(['afterRollback']);
			}
		}
	};
}

async function callHandler(handler, body) {
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
		headers: { authorization: 'Bearer test' },
		body
	}, response);
	return jsonResult;
}

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
