import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');

describe('sync client auto start', () => {
	test('starts when start is called and stays running', async () => {
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: { enabled: true, intervalMs: 0 },
				tables: ['customer']
			},
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
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		expect(client.isRunning()).toBe(false);
		await client.start();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(client.isRunning()).toBe(true);
		client.stop();
		expect(client.isRunning()).toBe(false);
	});
	test('emits sync errors', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});
		await new Promise((resolve) => setTimeout(resolve, 0));
		client.stop();
		const events = [];
		client.on('error', (payload) => events.push(['error', payload.method, payload.error.message]));
		client.once('sync-error', (payload) => events.push(['sync-error', payload.method, payload.error.message]));

		await expect(client.sync()).rejects.toThrow();

		expect(events.map((x) => x[0])).toEqual(['sync-error', 'error']);
		expect(events.map((x) => x[1])).toEqual(['sync', 'sync']);
	});

	test('emits sync event on success', async () => {
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
		client.on('sync', (payload) => events.push(['sync', payload.method]));

		await client.sync();

		expect(events).toEqual([
			['sync', 'sync']
		]);
	});

	test('uses 1000 as default pull key batch size', async () => {
		const requests = [];
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
				axios.request = async (request) => {
					requests.push(request);
					return {
						data: request.data.phase === 'keys'
							? { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
							: { phase: 'push', applied: 0, duplicates: 0, results: [] }
					};
				};
			}
		});

		await client.sync();

		const keysRequest = requests.find(request => request.data.phase === 'keys');
		expect(keysRequest.data.limit).toBe(1000);
	});

	test('rejects non-timeout sync options', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});

		await expect(client.sync({ mutations: [] }))
			.rejects.toThrow('Unsupported sync option "mutations"');
	});

	test('applies sync request and response error interceptors', async () => {
		const seen = [];
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
				axios.request = async (request) => {
					seen.push(['auth', request.headers.Authorization]);
					const error = new Error('Request failed with status code 401');
					error.response = {
						status: 401,
						statusText: 'Unauthorized',
						data: 'expired'
					};
					throw error;
				};
			}
		});
		client.interceptors.request.use((config) => {
			config.headers = { ...(config.headers || {}), Authorization: 'Bearer token-1' };
			return config;
		});
		client.interceptors.response.use(undefined, (error) => {
			seen.push(['error', error.response.status]);
			throw error;
		});

		await expect(client.sync()).rejects.toThrow('Request failed with status code 401');

		expect(seen).toEqual([
			['auth', 'Bearer token-1'],
			['error', 401]
		]);
	});

	test('serializes sync operations with web locks', async () => {
		const restoreLocks = installFakeWebLocks();
		const requests = [];
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				tables: ['customer'],
				crossTabLock: { name: 'orange-test-sync-lock' }
			},
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
				axios.request = async (request) => {
					const deferred = newDeferred();
					requests.push(deferred);
					deferred.request = request;
					return deferred.promise;
				};
			}
		});

		try {
			const first = client.sync();
			const second = client.sync();
			await wait(0);

			expect(requests).toHaveLength(1);
			requests[0].resolve({ data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' } });
			await first;
			await wait(0);

			expect(requests).toHaveLength(2);
			requests[1].resolve({ data: { phase: 'keys', items: [], done: true, cursor: 'cursor-2' } });
			await second;
		}
		finally {
			restoreLocks();
		}
	});

	test('releases sync web lock after sync timeout', async () => {
		const restoreLocks = installFakeWebLocks();
		const requests = [];
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				tables: ['customer'],
				crossTabLock: { name: 'orange-test-timeout-lock' }
			},
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
				axios.request = async (request) => {
					requests.push(request);
					if (requests.length === 1)
						return new Promise(() => {});
					return {
						data: { phase: 'keys', items: [], done: true, cursor: 'cursor-2' }
					};
				};
			}
		});

		try {
			await expect(client.sync({ timeoutMs: 5 }))
				.rejects.toThrow('Timed out while holding sync lock');

			await client.sync();

			expect(requests).toHaveLength(2);
		}
		finally {
			restoreLocks();
		}
	});

	test('can disable sync cross-tab lock', async () => {
		let lockRequests = 0;
		const restoreLocks = installFakeWebLocks({
			request: async (_name, _options, callback) => {
				lockRequests += 1;
				return callback();
			}
		});
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				tables: ['customer'],
				crossTabLock: false
			},
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
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		try {
			await client.sync();

			expect(lockRequests).toBe(0);
		}
		finally {
			restoreLocks();
		}
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

		await client.sync();

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

		await client.sync();

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

		await client.sync();
		await client.sync();

		const stateTableCreates = db.queryLog.filter(x => x.includes('CREATE TABLE IF NOT EXISTS "orange_sync_state"'));
		expect(stateTableCreates).toHaveLength(1);
	});

	test('resetLocal clears ensured internal table cache', async () => {
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'], schema: false },
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
				customer: {
					patch: async () => ({ changed: [] })
				},
				query: db.query.bind(db)
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		await client.sync();
		await client.resetLocal({ force: true });
		await client.sync();

		const resetDropIndex = db.queryLog.findIndex((sql) => /DROP TABLE IF EXISTS "orange_sync_state"/u.test(sql));
		const createStateTableIndexes = db.queryLog
			.map((sql, index) => /CREATE TABLE IF NOT EXISTS "orange_sync_state"/u.test(sql) ? index : -1)
			.filter((index) => index !== -1);

		expect(resetDropIndex).toBeGreaterThan(-1);
		expect(createStateTableIndexes.some((index) => index > resetDropIndex)).toBe(true);
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

		await client.sync();

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

		await client.sync();

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

		await client.sync();

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

		await client.sync();

		expect(sawAllRowsBeforeFirstPatch).toBe(true);
		expect(rowRequests).toEqual([[1], [2], [3]]);
	});

	test('batches pull journal item inserts', async () => {
		const items = Array.from({ length: 600 }, (_x, index) => ({
			table: 'customer',
			pk: [index + 1],
			key: { id: index + 1 },
			op: 'U'
		}));
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 600,
					maxRowsPerBatch: 500
				}
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async () => ({ changed: [] })
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
								items,
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

		await client.sync();
		const journalInserts = db.queryLog.filter(sql => /INSERT INTO "orange_sync_pull_item"/u.test(sql));
		const fullJournalDeletes = db.queryLog.filter(sql => /^DELETE FROM "orange_sync_pull_item"$/u.test(sql));
		const scopedJournalDeletes = db.queryLog.filter(sql => /^DELETE FROM "orange_sync_pull_item" WHERE/u.test(sql));
		const journalRows = journalInserts.flatMap(parseSqlValueRows);

		expect(journalInserts).toHaveLength(2);
		expect(journalInserts[0]).toContain('), (');
		expect(journalRows).toHaveLength(600);
		expect(journalRows.every(row => row[5] === null)).toBe(true);
		expect(fullJournalDeletes).toHaveLength(1);
		expect(scopedJournalDeletes).toHaveLength(0);
	});

	test('does not rebuild stable base when sync has no local changes', async () => {
		const db = newJournalDb({
			__sqliteSync: { url: '/rdb', auto: false, schema: false },
			sqliteTables: [{
				name: 'customer',
				sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)'
			}],
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)',
				ordinal: 0
			}]
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async () => ({ changed: [] })
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		await client.sync();

		const baseCopies = db.queryLog.filter(sql => /CREATE TABLE "orange_sync_base_data_/u.test(sql));
		expect(baseCopies).toHaveLength(0);
	});

	test('prefetches next staged pull batch before journal commit completes', async () => {
		const events = [];
		const patches = [];
		let firstJournalInsertRelease;
		let blockedFirstJournalInsert = false;
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
		const query = db.query;
		db.query = async (sql) => {
			if (!blockedFirstJournalInsert && /INSERT INTO "orange_sync_pull_item"/u.test(sql)) {
				blockedFirstJournalInsert = true;
				events.push('journal:start:1');
				await new Promise((resolve) => {
					firstJournalInsertRelease = resolve;
				});
				events.push('journal:end:1');
			}
			return query(sql);
		};
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
						const token = request.data.token && request.data.token.page;
						events.push(`keys:${token || 0}`);
						return token
							? {
								data: {
									phase: 'keys',
									items: [{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }],
									done: true,
									cursor: 'cursor-2'
								}
							}
							: {
								data: {
									phase: 'keys',
									items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
									done: false,
									cursor: 'cursor-1',
									token: { page: 1 }
								}
							};
					}
					events.push(`rows:${request.data.items[0].pk[0]}`);
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

		const syncPromise = client.sync();
		await waitFor(() => firstJournalInsertRelease && events.includes('keys:1'));
		expect(events).not.toContain('journal:end:1');
		firstJournalInsertRelease();
		await syncPromise;

		expect(events.indexOf('keys:1')).toBeLessThan(events.indexOf('journal:end:1'));
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }],
			[{ op: 'add', path: '/[2]', value: { id: 2 } }]
		]);
	});

	test('skips pull journal and foreign key check for empty staged pull', async () => {
		let foreignKeyChecks = 0;
		const db = newJournalDb({
			__sqliteSync: { url: '/rdb', auto: false, schema: false },
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)',
				ordinal: 0
			}],
			foreignKeyCheck: () => {
				foreignKeyChecks += 1;
				return [];
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async () => ({ changed: [] })
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		await client.sync();

		expect(db.queryLog.some(sql => /INSERT INTO "orange_sync_pull_session"/u.test(sql))).toBe(false);
		expect(db.queryLog.some(sql => /UPDATE "orange_sync_pull_session"/u.test(sql))).toBe(false);
		expect(db.queryLog.some(sql => /DELETE FROM "orange_sync_pull_item"/u.test(sql))).toBe(false);
		expect(foreignKeyChecks).toBe(0);
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

		await expect(client.sync()).rejects.toThrow('network down');
		expect(rowRequests).toEqual([[1]]);
		expect(db.journal.items).toHaveLength(1);
		expect(db.journal.items[0].key_json).toBeNull();

		await client.sync();

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

		await expect(client.sync()).rejects.toThrow('Foreign key validation failed after sync apply');
		expect(db.journal.session).not.toBeNull();
		expect(db.journal.items).toHaveLength(1);
		patches.length = 0;
		failForeignKeyCheck = false;

		await client.sync();

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
		baseEntries: (config.baseEntries || []).slice(),
		sqliteTables: (config.sqliteTables || []).slice(),
		foreignKeyCheck: config.foreignKeyCheck
	};
	const queryLog = config.queryLog || [];
	const db = {
		...config,
		queryLog,
		journal,
		query: async (sql) => {
			queryLog.push(sql);
			return queryJournal(journal, sql);
		}
	};
	return db;
}

function queryJournal(journal, sql) {
	if (/PRAGMA foreign_key_check/u.test(sql))
		return typeof journal.foreignKeyCheck === 'function' ? journal.foreignKeyCheck() : [];
	if (/SELECT "name" FROM "orange_sync_base_tables" LIMIT 1/u.test(sql))
		return journal.baseEntries.length > 0 ? [{ name: journal.baseEntries[0].name }] : [];
	if (/SELECT "name", "base_name", "schema_sql", "ordinal" FROM "orange_sync_base_tables"/u.test(sql))
		return journal.baseEntries;
	if (/SELECT "name", "sql" FROM sqlite_schema/u.test(sql))
		return journal.sqliteTables;
	if (/DELETE FROM "orange_sync_base_tables"/u.test(sql)) {
		journal.baseEntries = [];
		return [];
	}
	if (/INSERT INTO "orange_sync_base_tables"/u.test(sql)) {
		const values = parseSqlValues(sql);
		journal.baseEntries.push({
			name: values[0],
			base_name: values[1],
			schema_sql: values[2],
			ordinal: Number(values[3] || 0)
		});
		return [];
	}
	if (/^(CREATE|DROP) TABLE/u.test(sql) && /orange_sync_base_data_/u.test(sql))
		return [];
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
		const rows = parseSqlValueRows(sql);
		for (let i = 0; i < rows.length; i++) {
			const values = rows[i];
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
		}
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
	if (/^DELETE FROM "orange_sync_pull_item"$/u.test(sql)) {
		journal.items = [];
		return [];
	}
	if (/DELETE FROM "orange_sync_pull_item" WHERE/u.test(sql)) {
		const scope = firstSqlString(sql);
		journal.items = journal.items.filter(item => item.scope !== scope);
		return [];
	}
	if (/^DELETE FROM "orange_sync_pull_session"$/u.test(sql)) {
		journal.session = null;
		return [];
	}
	if (/DELETE FROM "orange_sync_pull_session" WHERE/u.test(sql)) {
		journal.session = null;
		return [];
	}
	return [];
}

function firstSqlString(sql) {
	const match = /'((?:''|[^'])*)'/u.exec(sql);
	return match ? match[1].replace(/''/g, '\'') : undefined;
}

async function waitFor(predicate, timeoutMs = 1000) {
	const startedAt = Date.now();
	while (!predicate()) {
		if (Date.now() - startedAt > timeoutMs)
			throw new Error('Timed out waiting for condition');
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}

function parseSqlValues(sql) {
	return parseSqlValueRows(sql)[0] || [];
}

function parseSqlValueRows(sql) {
	const start = sql.indexOf('VALUES ');
	if (start === -1)
		return [];
	const rows = [];
	let index = start + 'VALUES '.length;
	while (index < sql.length) {
		while (sql[index] === ' ' || sql[index] === ',')
			index += 1;
		if (sql[index] !== '(')
			break;
		index += 1;
		const row = [];
		while (index < sql.length) {
			while (sql[index] === ' ' || sql[index] === ',')
				index += 1;
			if (sql[index] === ')') {
				index += 1;
				break;
			}
			const parsed = parseSqlValue(sql, index);
			row.push(parsed.value);
			index = parsed.next;
		}
		rows.push(row);
	}
	return rows;
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
	const nextClose = sql.indexOf(')', index);
	let end = sql.length;
	if (nextComma !== -1)
		end = Math.min(end, nextComma);
	if (nextClose !== -1)
		end = Math.min(end, nextClose);
	const raw = sql.slice(index, end).trim();
	if (/^NULL$/iu.test(raw))
		return { value: null, next: end };
	const number = Number(raw);
	return { value: Number.isFinite(number) ? number : raw, next: end };
}

function installFakeWebLocks(locks) {
	const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
	const fakeLocks = locks || newSerialWebLocks();
	Object.defineProperty(globalThis, 'navigator', {
		configurable: true,
		value: { locks: fakeLocks }
	});
	return () => {
		if (previous)
			Object.defineProperty(globalThis, 'navigator', previous);
		else
			delete globalThis.navigator;
	};
}

function newSerialWebLocks() {
	const queues = new Map();
	return {
		request(name, _options, callback) {
			const previous = queues.get(name) || Promise.resolve();
			const current = previous.then(() => callback());
			queues.set(name, current.catch(() => {}));
			return current;
		}
	};
}

function newDeferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
