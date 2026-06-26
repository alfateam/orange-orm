import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');

describe('sync client auto start', () => {
	test('starts when start is called and stays running', async () => {
		const client = newSyncClient({}, async () => ({
			__sqliteSync: {
				url: '/rdb',
				auto: { enabled: true, intervalMs: 0, push: false, pull: false }
			}
		}), {});

		expect(client.isRunning()).toBe(false);
		await client.start();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(client.isRunning()).toBe(true);
		client.stop();
		expect(client.isRunning()).toBe(false);
	});
	test('emits push and pull errors', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});
		await new Promise((resolve) => setTimeout(resolve, 0));
		client.stop();
		const events = [];
		client.on('error', (payload) => events.push(['error', payload.method, payload.error.message]));
		client.once('push-error', (payload) => events.push(['push-error', payload.method, payload.error.message]));
		client.on('pull-error', (payload) => events.push(['pull-error', payload.method, payload.error.message]));

		await expect(client.push({ mutations: [{ id: 'm1' }] })).rejects.toThrow();
		await expect(client.pull()).rejects.toThrow();

		expect(events.map((x) => x[0])).toEqual(['push-error', 'error', 'pull-error', 'error']);
		expect(events.map((x) => x[1])).toEqual(['push', 'push', 'pull', 'pull']);
	});

	test('emits push, pull and sync events on success', async () => {
		const events = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				customer: {
					patch: async () => ({ changed: [] })
				},
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => ({
					data: request.data.phase === 'keys'
						? { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
						: { phase: 'push', applied: 0, duplicates: 0, results: [] }
				});
			}
		});
		client.on('push', (payload) => events.push(['push', payload.method]));
		client.on('pull', (payload) => events.push(['pull', payload.method]));
		client.on('sync', (payload) => events.push(['sync', payload.method]));

		await client.push({ mutations: [{ id: 'm1', table: 'customer', patch: [] }] });
		await client.pull();

		expect(events).toEqual([
			['push', 'push'],
			['sync', 'push'],
			['pull', 'pull'],
			['sync', 'pull']
		]);
	});

	test('uses all mapped tables when sync tables are omitted', async () => {
		const requests = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			tables: {
				customer: {},
				order: {}
			},
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					requests.push(request);
					return {
						data: {
							phase: 'keys',
							items: [],
							done: true,
							cursor: 'cursor-1'
						}
					};
				};
			}
		});

		await client.pull();

		expect(requests[0].data.tables).toEqual(['customer', 'order']);
	});

	test('uses client mapped tables when db object has no table map', async () => {
		const requests = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			query: async () => []
		};
		const client = newSyncClient({
			tables: {
				customer: {},
				order: {}
			},
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					requests.push(request);
					return {
						data: {
							phase: 'keys',
							items: [],
							done: true,
							cursor: 'cursor-1'
						}
					};
				};
			}
		});

		await client.pull();

		expect(requests[0].data.tables).toEqual(['customer', 'order']);
	});

	test('does not rerun internal sync table DDL after first pull', async () => {
		const db = {
			__sqliteSync: { url: '/rdb', auto: false },
			queryLog: [],
			query: async function(sql) {
				this.queryLog.push(sql);
				return [];
			}
		};
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: {
						phase: 'keys',
						items: [],
						done: true,
						cursor: 'cursor-1'
					}
				});
			}
		});

		await client.pull();
		await client.pull();

		const stateTableCreates = db.queryLog.filter(x => x.includes('CREATE TABLE IF NOT EXISTS "orange_sync_state"'));
		expect(stateTableCreates).toHaveLength(1);
	});

	test('resetLocal clears ensured internal table cache', async () => {
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			queryLog: [],
			query: async function(sql) {
				this.queryLog.push(sql);
				if (/SELECT "id" FROM "orange_sync_client"/u.test(sql))
					return [];
				return [];
			}
		};
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			}
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'push', applied: 1, duplicates: 0, results: [] }
				});
			}
		});

		await client.push({ mutations: [{ id: 'm1', table: 'customer', patch: [] }] });
		await client.resetLocal({ force: true });
		await client.push({ mutations: [{ id: 'm2', table: 'customer', patch: [] }] });

		const resetDropIndex = db.queryLog.findIndex((sql) => /DROP TABLE IF EXISTS "orange_sync_client"/u.test(sql));
		const createClientTableIndexes = db.queryLog
			.map((sql, index) => /CREATE TABLE IF NOT EXISTS "orange_sync_client"/u.test(sql) ? index : -1)
			.filter((index) => index !== -1);

		expect(resetDropIndex).toBeGreaterThan(-1);
		expect(createClientTableIndexes.some((index) => index > resetDropIndex)).toBe(true);
	});

	test('applies staged pull rows through insertAndForget strategy and skips sqlite post-insert select', async () => {
		const patches = [];
		const options = [];
		const db = newJournalDb({
			__sqliteSync: { url: '/rdb', auto: false, schema: false },
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch, patchOptions) => {
						patches.push(patch);
						options.push(patchOptions);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [
									{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
									{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }
								],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					return {
						data: {
							phase: 'rows',
							items: request.data.items.map((item) => ({
								table: item.table,
								pk: item.pk,
								key: item.key,
								row: { id: item.pk[0] },
								op: item.op
							}))
						}
					};
				};
			}
		});

		await client.pull();

		expect(patches).toEqual([
			[
				{ op: 'add', path: '/[1]', value: { id: 1 } },
				{ op: 'add', path: '/[2]', value: { id: 2 } }
			]
		]);
		expect(options[0]).toMatchObject({
			concurrency: 'overwrite',
			skipSelectAfterInsert: true,
			strategy: { insertAndForget: true }
		});
	});

	test('continues staged row fetch when rows response is partial', async () => {
		const patches = [];
		const rowRequests = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 2,
					maxRowsPerBatch: 2
				}
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						patches.push(patch);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [
									{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
									{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }
								],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					const first = request.data.items[0];
					return {
						data: {
							phase: 'rows',
							items: [{
								table: first.table,
								pk: first.pk,
								key: first.key,
								row: { id: first.pk[0] },
								op: first.op
							}]
						}
					};
				};
			}
		});

		const result = await client.pull();

		expect(result.applied).toBe(2);
		expect(rowRequests).toEqual([[1, 2], [2]]);
		expect(patches).toEqual([
			[
				{ op: 'add', path: '/[1]', value: { id: 1 } },
				{ op: 'add', path: '/[2]', value: { id: 2 } }
			]
		]);
	});

	test('does not count missing staged rows as applied', async () => {
		const patches = [];
		const rowRequests = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 2,
					maxRowsPerBatch: 2
				}
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						patches.push(patch);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [
									{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
									{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }
								],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					return {
						data: {
							phase: 'rows',
							items: request.data.items
								.filter((item) => item.pk[0] === 1)
								.map((item) => ({
									table: item.table,
									pk: item.pk,
									key: item.key,
									row: { id: item.pk[0] },
									op: item.op
								}))
						}
					};
				};
			}
		});

		const result = await client.pull();

		expect(result.applied).toBe(1);
		expect(rowRequests).toEqual([[1, 2], [2]]);
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }]
		]);
	});

	test('stages all row batches before applying app data', async () => {
		const rowRequests = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 3,
					maxRowsPerBatch: 1
				}
			}
		});
		let sawAllRowsBeforeFirstPatch = false;
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						if (patch[0]?.path === '/[1]')
							sawAllRowsBeforeFirstPatch = rowRequests.length === 3;
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [
									{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
									{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' },
									{ table: 'customer', pk: [3], key: { id: 3 }, op: 'U' }
								],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					return {
						data: {
							phase: 'rows',
							items: request.data.items.map((item) => ({
								table: item.table,
								pk: item.pk,
								key: item.key,
								row: { id: item.pk[0] },
								op: item.op
							}))
						}
					};
				};
			}
		});

		await client.pull();

		expect(sawAllRowsBeforeFirstPatch).toBe(true);
		expect(rowRequests).toEqual([[1], [2], [3]]);
	});

	test('resumes staged pull without reloading persisted batches after request failure', async () => {
		const patches = [];
		const keyRequests = [];
		const rowRequests = [];
		let failNextContinuation = true;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 1,
					maxRowsPerBatch: 1
				}
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						patches.push(patch);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						keyRequests.push(request.data.token || null);
						if (!request.data.token) {
							return {
								data: {
									phase: 'keys',
									items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
									done: false,
									cursor: 'cursor-1',
									token: { page: 1 }
								}
							};
						}
						if (failNextContinuation) {
							failNextContinuation = false;
							throw new Error('network down');
						}
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }],
								done: true,
								cursor: 'cursor-2'
							}
						};
					}
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					return {
						data: {
							phase: 'rows',
							items: request.data.items.map((item) => ({
								table: item.table,
								pk: item.pk,
								key: item.key,
								row: { id: item.pk[0] },
								op: item.op
							}))
						}
					};
				};
			}
		});

		await expect(client.pull()).rejects.toThrow('network down');
		expect(rowRequests).toEqual([[1]]);

		const result = await client.pull();

		expect(result.applied).toBe(2);
		expect(keyRequests).toEqual([null, { page: 1 }, { page: 1 }]);
		expect(rowRequests).toEqual([[1], [2]]);
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }],
			[{ op: 'add', path: '/[2]', value: { id: 2 } }]
		]);
	});

	test('keeps completed journal after fk validation failure and retries without remote fetch', async () => {
		const patches = [];
		const keyRequests = [];
		const rowRequests = [];
		let failForeignKeyCheck = true;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false
			},
			foreignKeyCheck: () => failForeignKeyCheck ? [{ table: 'customer' }] : []
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						patches.push(patch);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						keyRequests.push(request.data.token || null);
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					return {
						data: {
							phase: 'rows',
							items: request.data.items.map((item) => ({
								table: item.table,
								pk: item.pk,
								key: item.key,
								row: { id: item.pk[0] },
								op: item.op
							}))
						}
					};
				};
			}
		});

		await expect(client.pull()).rejects.toThrow('Foreign key validation failed after sync apply');
		expect(db.journal.session).not.toBeNull();
		expect(db.journal.items).toHaveLength(1);
		patches.length = 0;
		failForeignKeyCheck = false;

		const result = await client.pull();

		expect(result.applied).toBe(1);
		expect(keyRequests).toEqual([null]);
		expect(rowRequests).toEqual([[1]]);
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }]
		]);
		expect(db.journal.session).toBeNull();
		expect(db.journal.items).toHaveLength(0);
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

function newJournalDb(config) {
	const journal = {
		session: null,
		items: [],
		state: new Map(),
		foreignKeyCheck: config.foreignKeyCheck
	};
	return {
		...config,
		journal,
		query: async (sql) => queryJournal(journal, sql)
	};
}

function queryJournal(journal, sql) {
	if (/PRAGMA foreign_key_check/u.test(sql))
		return typeof journal.foreignKeyCheck === 'function' ? journal.foreignKeyCheck() : [];
	if (/SELECT "since_value" FROM "orange_sync_state"/u.test(sql)) {
		const scope = firstSqlString(sql);
		const value = journal.state.get(scope);
		return value === undefined ? [] : [{ since_value: value }];
	}
	if (/INSERT INTO "orange_sync_state"/u.test(sql)) {
		const values = parseSqlValues(sql);
		journal.state.set(values[0], values[1]);
		return [];
	}
	if (/SELECT "scope", "since_value", "token_json"/u.test(sql)) {
		return journal.session ? [journal.session] : [];
	}
	if (/INSERT INTO "orange_sync_pull_session"/u.test(sql)) {
		const values = parseSqlValues(sql);
		journal.session = {
			scope: values[0],
			since_value: values[1],
			token_json: values[2],
			done: Number(values[3] || 0),
			final_since: values[4],
			payload_json: values[5],
			reason: values[6],
			status: values[7],
			next_seq: Number(values[8] || 0),
			next_batch: Number(values[9] || 0)
		};
		return [];
	}
	if (/INSERT INTO "orange_sync_pull_item"/u.test(sql)) {
		const values = parseSqlValues(sql);
		journal.items.push({
			scope: values[0],
			batch_no: Number(values[1]),
			seq: Number(values[2]),
			table_name: values[3],
			pk_json: values[4],
			key_json: values[5],
			op: values[6],
			row_json: values[7]
		});
		return [];
	}
	if (/UPDATE "orange_sync_pull_session"/u.test(sql)) {
		const assignments = parseSqlAssignments(sql);
		if (!journal.session)
			return [];
		journal.session = {
			...journal.session,
			token_json: assignments.token_json,
			done: Number(assignments.done || 0),
			final_since: assignments.final_since,
			payload_json: assignments.payload_json,
			reason: assignments.reason,
			status: assignments.status,
			next_seq: Number(assignments.next_seq || 0),
			next_batch: Number(assignments.next_batch || 0)
		};
		return [];
	}
	if (/SELECT "batch_no", "seq", "table_name"/u.test(sql)) {
		const scope = firstSqlString(sql);
		return journal.items
			.filter(item => item.scope === scope)
			.sort((a, b) => a.batch_no - b.batch_no || a.seq - b.seq);
	}
	if (/DELETE FROM "orange_sync_pull_item"/u.test(sql)) {
		const scope = firstSqlString(sql);
		journal.items = journal.items.filter(item => item.scope !== scope);
		return [];
	}
	if (/DELETE FROM "orange_sync_pull_session"/u.test(sql)) {
		journal.session = null;
		return [];
	}
	return [];
}

function firstSqlString(sql) {
	const match = /'((?:''|[^'])*)'/u.exec(sql);
	return match ? match[1].replace(/''/g, '\'') : undefined;
}

function parseSqlValues(sql) {
	const start = sql.indexOf('VALUES (');
	if (start === -1)
		return [];
	const valuesSql = sql.slice(start + 'VALUES ('.length, sql.lastIndexOf(')'));
	return parseSqlList(valuesSql);
}

function parseSqlAssignments(sql) {
	const setStart = sql.indexOf(' SET ');
	const whereStart = sql.indexOf(' WHERE ');
	const setSql = sql.slice(setStart + 5, whereStart === -1 ? undefined : whereStart);
	const result = {};
	let index = 0;
	while (index < setSql.length) {
		while (setSql[index] === ' ' || setSql[index] === ',')
			index += 1;
		if (setSql[index] !== '"')
			break;
		const nameEnd = setSql.indexOf('"', index + 1);
		const name = setSql.slice(index + 1, nameEnd);
		index = setSql.indexOf('=', nameEnd) + 1;
		const parsed = parseSqlValue(setSql, index);
		result[name] = parsed.value;
		index = parsed.next;
	}
	return result;
}

function parseSqlList(sql) {
	const values = [];
	let index = 0;
	while (index < sql.length) {
		while (sql[index] === ' ' || sql[index] === ',')
			index += 1;
		const parsed = parseSqlValue(sql, index);
		values.push(parsed.value);
		index = parsed.next;
	}
	return values;
}

function parseSqlValue(sql, index) {
	while (sql[index] === ' ')
		index += 1;
	if (sql[index] === '\'') {
		let value = '';
		index += 1;
		while (index < sql.length) {
			if (sql[index] === '\'' && sql[index + 1] === '\'') {
				value += '\'';
				index += 2;
				continue;
			}
			if (sql[index] === '\'')
				return { value, next: index + 1 };
			value += sql[index];
			index += 1;
		}
		return { value, next: index };
	}
	const nextComma = sql.indexOf(',', index);
	const end = nextComma === -1 ? sql.length : nextComma;
	const raw = sql.slice(index, end).trim();
	if (/^NULL$/iu.test(raw))
		return { value: null, next: end };
	const number = Number(raw);
	return { value: Number.isFinite(number) ? number : raw, next: end };
}
