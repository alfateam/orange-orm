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
					calls.push(['getMany', filter.where()]);
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
			items: [
				{ table: 'project', pk: [1], op: 'U' },
				{ table: 'project', pk: [1], op: 'U' }
			]
		});

		expect(calls.map(x => x[0])).toEqual([
			'beforeBegin',
			'afterBegin',
			'getMany',
			'beforeCommit',
			'afterCommit'
		]);
		expect(calls[2][1]).toEqual([{ id: 1 }]);
		expect(transactionOptions).toEqual([{ readonly: true }]);
		expect(jsonResult.items).toEqual([
			{ table: 'project', pk: [1], key: { id: 1 }, row: { id: 1, name: 'Project 1' }, op: 'U' },
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
			'afterCommit',
			'beforeBegin',
			'afterBegin',
			'getMany',
			'beforeCommit',
			'afterCommit'
		]);
		expect(calls.filter(x => x[0] === 'getMany').map(x => x[1])).toEqual(['id desc', 'id']);
		expect(transactionOptions).toEqual([{ readonly: true }, { readonly: true }]);
		expect(jsonResult.mode).toBe('snapshot');
		expect(jsonResult.items).toEqual([
			{ table: 'project', pk: [1], key: { id: 1 }, op: 'U' }
		]);
	});

	test('uses keyset pagination for snapshot key fetch', async () => {
		const seen = [];
		const tx = {
			project: {
				getMany: async (filter, strategy) => {
					seen.push({ filter, strategy });
					if (strategy.orderBy[0] === 'id desc')
						return [{ id: 3 }];
					const after = Array.isArray(filter?.parameters) && filter.parameters.length > 1
						? filter.parameters[0]
						: 0;
					const upper = Array.isArray(filter?.parameters)
						? filter.parameters[filter.parameters.length - 1]
						: Infinity;
					return [1, 2, 3]
						.filter(id => id > after && id <= upper)
						.slice(0, strategy.limit)
						.map(id => ({ id }));
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn) => fn(tx),
			query: async () => [{ min_id: 1, max_id: 1 }]
		};
		const handler = newSyncHandler(client, {
			sync: {
				limits: {
					maxKeysPerBatch: 2
				}
			}
		});

		const first = await callHandler(handler, {
			phase: 'keys',
			tables: ['project']
		});
		const second = await callHandler(handler, {
			phase: 'keys',
			tables: ['project'],
			token: first.token
		});

		expect(first.items.map(x => x.pk)).toEqual([[1], [2]]);
		expect(first.token.lastPk).toEqual([2]);
		expect(first.token.upperPks.project).toEqual([3]);
		expect(second.items.map(x => x.pk)).toEqual([[3]]);
		const keyFetches = seen.filter(x => x.strategy.orderBy[0] === 'id');
		expect(keyFetches[0].strategy.offset).toBeUndefined();
		expect(keyFetches[1].strategy.offset).toBeUndefined();
		expect(keyFetches[1].filter.sql).toContain('"id" > ?');
		expect(keyFetches[1].filter.sql).toContain('NOT');
		expect(keyFetches[1].filter.parameters).toEqual([2, 3]);
	});

	test('snapshot key fetch ignores rows inserted after initial primary key upper bound', async () => {
		const seen = [];
		const sourceIds = [1, 2, 3];
		const tx = {
			project: {
				getMany: async (filter, strategy) => {
					seen.push({ filter, strategy });
					if (strategy.orderBy[0] === 'id desc')
						return [{ id: Math.max.apply(null, sourceIds) }];
					const after = Array.isArray(filter?.parameters) && filter.parameters.length > 1
						? filter.parameters[0]
						: 0;
					const upper = Array.isArray(filter?.parameters)
						? filter.parameters[filter.parameters.length - 1]
						: Infinity;
					return sourceIds
						.filter(id => id > after && id <= upper)
						.slice(0, strategy.limit)
						.map(id => ({ id }));
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn) => fn(tx),
			query: async () => [{ min_id: 1, max_id: 1 }]
		};
		const handler = newSyncHandler(client, {
			sync: {
				limits: {
					maxKeysPerBatch: 2
				}
			}
		});

		const first = await callHandler(handler, {
			phase: 'keys',
			tables: ['project']
		});
		sourceIds.push(4, 5);
		const second = await callHandler(handler, {
			phase: 'keys',
			tables: ['project'],
			token: first.token
		});

		expect(first.items.map(x => x.pk)).toEqual([[1], [2]]);
		expect(second.items.map(x => x.pk)).toEqual([[3]]);
		expect(second.done).toBe(true);
		expect(seen.filter(x => x.strategy.orderBy[0] === 'id desc')).toHaveLength(1);
	});

	test('limits snapshot keys by server row batch limit', async () => {
		const seenStrategies = [];
		const tx = {
			project: {
				getMany: async (_filter, strategy) => {
					seenStrategies.push(strategy);
					if (strategy.orderBy[0] === 'id desc')
						return [{ id: 3 }];
					return [1, 2, 3]
						.slice(0, strategy.limit)
						.map(id => ({ id }));
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn) => fn(tx),
			query: async () => [{ min_id: 1, max_id: 1 }]
		};
		const handler = newSyncHandler(client, {
			sync: {
				limits: {
					maxKeysPerBatch: 3,
					maxRowsPerBatch: 1
				}
			}
		});

		const result = await callHandler(handler, {
			phase: 'keys',
			tables: ['project'],
			limit: 3
		});

		expect(seenStrategies.filter(x => x.orderBy[0] === 'id')[0].limit).toBe(1);
		expect(result.items.map(x => x.pk)).toEqual([[1]]);
		expect(result.done).toBe(false);
	});

	test('allows client key batch above server default when server limit is omitted', async () => {
		const seenStrategies = [];
		const tx = {
			project: {
				getMany: async (_filter, strategy) => {
					seenStrategies.push(strategy);
					if (strategy.orderBy[0] === 'id desc')
						return [{ id: 1500 }];
					return Array.from({ length: strategy.limit }, (_x, index) => ({ id: index + 1 }));
				}
			}
		};
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async (fn) => fn(tx),
			query: async () => [{ min_id: 1, max_id: 1 }]
		};
		const handler = newSyncHandler(client, {
			sync: {}
		});

		const result = await callHandler(handler, {
			phase: 'keys',
			tables: ['project'],
			limit: 1200
		});

		expect(seenStrategies.filter(x => x.orderBy[0] === 'id')[0].limit).toBe(1200);
		expect(result.items).toHaveLength(1200);
		expect(result.done).toBe(false);
	});

	test('allows client row batch above server default when server limit is omitted', async () => {
		const itemCount = 1200;
		const tx = {
			project: {
				getMany: async () => Array.from({ length: itemCount }, (_x, index) => ({ id: index + 1 }))
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
			sync: {}
		});

		const result = await callHandler(handler, {
			phase: 'rows',
			items: Array.from({ length: itemCount }, (_x, index) => ({
				table: 'project',
				pk: [index + 1],
				op: 'U'
			}))
		});

		expect(result.limit).toBe(itemCount);
		expect(result.truncated).toBe(false);
		expect(result.items).toHaveLength(itemCount);
	});

	test('uses default max change window of 100000', async () => {
		const queries = [];
		const client = {
			tables: {
				project: newTable('project')
			},
			transaction: async () => {
				throw new Error('snapshot should not be used');
			},
			query: async (sql) => {
				queries.push(sql);
				if (sql.includes('MIN(id)'))
					return [{ min_id: 1, max_id: 100000 }];
				return [];
			}
		};
		const handler = newSyncHandler(client, {
			sync: {}
		});

		const result = await callHandler(handler, {
			phase: 'keys',
			tables: ['project'],
			since: 0
		});

		expect(result.mode).toBe('changes');
		expect(result.reason).toBeUndefined();
		expect(queries.some(sql => sql.includes('orange_changes'))).toBe(true);
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
