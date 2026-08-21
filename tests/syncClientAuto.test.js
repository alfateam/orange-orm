import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');
const { applyPullJournalSymbol, syncAndCapturePullJournalSymbol } = newSyncClient;

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

		await expect(client.isRunning()).resolves.toBe(false);
		await client.start();
		await new Promise((resolve) => setTimeout(resolve, 0));

		await expect(client.isRunning()).resolves.toBe(true);
		await client.stop();
		await expect(client.isRunning()).resolves.toBe(false);
	});

	test('explicit start runs even when sync auto is false', async () => {
		const requests = [];
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
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

		await client.start();
		await client.stop();

		expect(requests.some((request) => request.data.phase === 'keys')).toBe(true);
	});

	test('applies streamed pull journal batches without materializing or patching rows individually', async () => {
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				tables: ['customer']
			},
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)',
				ordinal: 0
			}],
			sqliteTables: [{
				name: 'customer',
				sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)'
			}]
		});
		const patchSizes = [];
		const progress = [];
		const batches = [journalItems(250, 1), journalItems(2, 251)];
		let batchIndex = 0;
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async (patch) => {
						patchSizes.push(patch.length);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {});

		const result = await client[applyPullJournalSymbol]({
			scopeKey: 'customer',
			tables: ['customer'],
			finalSince: 'cursor-252',
			itemCount: 252
		}, {
			_itemCount: 252,
			_readPullJournalBatch: async () => batches[batchIndex++] || null,
			_onPullJournalBatchApplied: (event) => progress.push(event)
		});

		expect(result).toMatchObject({
			applied: 252,
			tables: ['customer'],
			since: 'cursor-252',
			checkpointApplied: true
		});
		expect(patchSizes).toEqual([250, 2]);
		expect(progress).toEqual([
			{ processedItems: 250, totalItems: 252 },
			{ processedItems: 252, totalItems: 252 }
		]);
		expect(batchIndex).toBe(3);
		expect(JSON.parse(db.journal.state.get('customer')).since).toBe('cursor-252');
	});

	test('does not advance a streamed journal checkpoint until every configured apply chunk succeeds', async () => {
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				tables: ['customer'],
				pull: {
					apply: { maxRowsPerTransaction: 2 }
				}
			},
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)',
				ordinal: 0
			}],
			sqliteTables: [{
				name: 'customer',
				sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY)'
			}]
		});
		let failSecondPatch = true;
		let patchCall = 0;
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				customer: {
					patch: async () => {
						patchCall += 1;
						if (failSecondPatch && patchCall === 2)
							throw new Error('apply interrupted');
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {});
		const journal = {
			scopeKey: 'customer',
			tables: ['customer'],
			finalSince: 'cursor-3',
			itemCount: 3
		};

		let batchRead = false;
		await expect(client[applyPullJournalSymbol](journal, {
			_readPullJournalBatch: async () => {
				if (batchRead)
					return null;
				batchRead = true;
				return journalItems(3);
			}
		})).rejects.toThrow('apply interrupted');
		expect(db.journal.state.has('customer')).toBe(false);

		failSecondPatch = false;
		patchCall = 0;
		batchRead = false;
		await expect(client[applyPullJournalSymbol](journal, {
			_readPullJournalBatch: async () => {
				if (batchRead)
					return null;
				batchRead = true;
				return journalItems(2);
			}
		})).rejects.toThrow('ended after 2 of 3 expected items');
		expect(db.journal.state.has('customer')).toBe(false);

		patchCall = 0;
		batchRead = false;
		await client[applyPullJournalSymbol](journal, {
			_readPullJournalBatch: async () => {
				if (batchRead)
					return null;
				batchRead = true;
				return journalItems(3);
			}
		});

		expect(JSON.parse(db.journal.state.get('customer')).since).toBe('cursor-3');
		expect(patchCall).toBe(2);
	});

	test('emits sync errors', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});
		await new Promise((resolve) => setTimeout(resolve, 0));
		await client.stop();
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

	test('does not let a notification listener fail sync or skip later listeners', async () => {
		const events = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				customer: { patch: async () => ({ changed: [] }) },
				query: async () => []
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});
		client.on('sync', () => {
			throw new Error('listener failed');
		});
		client.on('sync', payload => events.push(payload.method));

		await expect(client.sync()).resolves.toBeUndefined();

		expect(events).toEqual(['sync']);
	});

	test('sets low priority on direct sync database queries', async () => {
		const queryOptions = [];
		const db = {
			__sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] },
			query: async (_query, options) => {
				queryOptions.push(options);
				return [];
			}
		};
		const client = newBasicSyncClient(db);

		await client.sync();

		expect(queryOptions.length).toBeGreaterThan(0);
		expect(queryOptions.every((options) => options && options.priority === 1)).toBe(true);
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

	test('derives default pull key batch size from row concurrency', async () => {
		const requests = [];
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				tables: ['customer'],
				pull: {
					maxConcurrentRowRequests: 4
				}
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
		expect(keysRequest.data.limit).toBe(4000);
	});

	test('rejects non-timeout sync options', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});

		await expect(client.sync({ mutations: [] }))
			.rejects.toThrow('Unsupported sync option "mutations"');
	});

	test('ensureLocalSchema skips when sync is not configured', async () => {
		const client = newSyncClient({}, async () => ({
			query: async () => {
				throw new Error('should not query');
			}
		}), {});

		await expect(client.ensureLocalSchema()).resolves.toEqual({ skipped: true });
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
					seen.push(['credentials', request.credentials]);
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
			config.credentials = 'include';
			return config;
		});
		client.interceptors.response.use(undefined, (error) => {
			seen.push(['error', error.response.status]);
			throw error;
		});

		await expect(client.sync()).rejects.toThrow('Request failed with status code 401');

		expect(seen).toEqual([
			['auth', 'Bearer token-1'],
			['credentials', 'include'],
			['error', 401]
		]);
	});

	test('stop cancels an initial sync waiting on a request interceptor', async () => {
		let interceptorStarted = false;
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				crossTabLock: false,
				tables: ['customer']
			},
			query: async () => []
		};
		const client = newSyncClient({
			transaction: async (fn) => fn({
				customer: { patch: async () => ({ changed: [] }) },
				query: async () => []
			})
		}, async () => db, {});
		client.interceptors.request.use(() => {
			interceptorStarted = true;
			return new Promise(() => {});
		});

		const start = client.start();
		await waitFor(() => interceptorStarted);
		await Promise.race([
			client.stop(),
			new Promise((_resolve, reject) => setTimeout(() => reject(new Error('stop did not cancel initial sync')), 1000))
		]);
		await start;

		await expect(client.isRunning()).resolves.toBe(false);
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

	test('times out while waiting without releasing an active sync web lock', async () => {
		const restoreLocks = installFakeWebLocks();
		const requests = [];
		const firstResponse = newDeferred();
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				tables: ['customer'],
				crossTabLock: { name: 'orange-test-timeout-lock' }
			},
			query: async () => []
		};
		const firstClient = createClient();
		const secondClient = createClient();

		try {
			const first = firstClient.sync();
			await waitUntil(() => requests.length === 1);
			await expect(secondClient.sync({ timeoutMs: 5 }))
				.rejects.toThrow('Timed out waiting for sync lock');
			expect(requests).toHaveLength(1);

			firstResponse.resolve({
				data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
			});
			await first;

			await secondClient.sync();

			expect(requests).toHaveLength(2);
		}
		finally {
			restoreLocks();
		}

		function createClient() {
			return newSyncClient({
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
							return firstResponse.promise;
						return {
							data: { phase: 'keys', items: [], done: true, cursor: 'cursor-2' }
						};
					};
				}
			});
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

	test('forces sync cross-tab lock for opfs-wl even when disabled', async () => {
		const lockNames = [];
		const restoreLocks = installFakeWebLocks({
			request: async (name, _options, callback) => {
				lockNames.push(name);
				return callback();
			}
		});
		const db = newSqliteOpfsSyncDb('opfs-wl', {
			crossTabLock: false
		});
		const client = newBasicSyncClient(db);

		try {
			await client.sync();

			expect(lockNames).toEqual([
				'orange-orm:sync:sqliteOPFS:sync-client.sqlite3:opfs-wl'
			]);
		}
		finally {
			restoreLocks();
		}
	});

	test('uses the requested opfs-wl sync lock before opening sqliteOPFS', async () => {
		const lockNames = [];
		const restoreLocks = installFakeWebLocks({
			request: async (name, _options, callback) => {
				lockNames.push(name);
				return callback();
			}
		});
		const sync = {
			url: '/rdb',
			auto: false,
			tables: ['customer'],
			crossTabLock: false
		};
		const db = {
			__sqliteSync: sync,
			poolFactory: {
				__sqliteSync: sync,
				__orangeSyncIdentity: 'sqliteOPFS:sync-client.sqlite3',
				__orangeSqliteOPFSConnectionString: 'sync-client.sqlite3',
				__orangeSqliteOPFSRequestedVfs: 'opfs-wl'
			},
			query: async () => []
		};
		const client = newBasicSyncClient(db);

		try {
			await client.sync();

			expect(lockNames).toEqual([
				'orange-orm:sync:sqliteOPFS:sync-client.sqlite3:opfs-wl'
			]);
		}
		finally {
			restoreLocks();
		}
	});

	test('scopes sync web locks by sqliteOPFS vfs', async () => {
		const requests = [];
		const restoreLocks = installFakeWebLocks();
		const sahpoolClient = newBasicSyncClient(newSqliteOpfsSyncDb('opfs-sahpool', {
			crossTabLock: { name: 'shared-sync-lock' }
		}), requests);
		const wlClient = newBasicSyncClient(newSqliteOpfsSyncDb('opfs-wl', {
			crossTabLock: { name: 'shared-sync-lock' }
		}), requests);

		try {
			const sahpoolSync = sahpoolClient.sync();
			const wlSync = wlClient.sync();
			await wait(0);

			expect(requests).toHaveLength(2);
			requests[0].resolve({ data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' } });
			requests[1].resolve({ data: { phase: 'keys', items: [], done: true, cursor: 'cursor-2' } });
			await Promise.all([sahpoolSync, wlSync]);
		}
		finally {
			restoreLocks();
		}
	});

	test('serializes explicit sync calls without cross-tab lock', async () => {
		const requests = [];
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
				axios.request = async (request) => {
					const deferred = newDeferred();
					deferred.request = request;
					requests.push(deferred);
					return deferred.promise;
				};
			}
		});

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
		await client.resetLocal();
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
		const baseDeletes = db.queryLog.filter(sql => /^DELETE FROM "orange_sync_base_data_.*" WHERE/u.test(sql));
		const baseInserts = db.queryLog.filter(sql => /^INSERT INTO "orange_sync_base_data_.*" SELECT \* FROM "customer" WHERE/u.test(sql));
		expect(baseDeletes).toHaveLength(1);
		expect(baseInserts).toHaveLength(1);
		expect(baseDeletes[0]).toMatch(/"id" IN \(1, 2\)/u);
		expect(baseInserts[0]).toMatch(/"id" IN \(1, 2\)/u);
		expect(db.queryLog.some(sql => /^CREATE INDEX IF NOT EXISTS "orange_sync_base_idx_.*" ON "orange_sync_base_data_.*" \("id"\)$/u.test(sql))).toBe(true);
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

	test('applies inline snapshot rows without a rows request', async () => {
		const patches = [];
		const phases = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false
			}
		});
		const client = newSyncClient({
			tables: { customer: newTable('customer') },
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
					phases.push(request.data.phase);
					expect(request.data.inlineRows).toBe(true);
					return {
						data: {
							phase: 'keys',
							mode: 'snapshot',
							items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U', row: { id: 1 } }],
							done: true,
							cursor: 'cursor-1'
						}
					};
				};
			}
		});

		await client.sync();

		expect(phases).toEqual(['keys']);
		expect(patches).toEqual([[
			{ op: 'add', path: '/[1]', value: { id: 1 } }
		]]);
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

	test('streams captured pull batches into staging without a full journal reread', async () => {
		const patches = [];
		const rowRequests = [];
		const secondRows = newDeferred();
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
						return request.data.token
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
					const id = request.data.items[0].pk[0];
					rowRequests.push(id);
					if (id === 2)
						return secondRows.promise;
					return rowsResponse(request.data.items);
				};
			}
		});

		const syncPromise = client[syncAndCapturePullJournalSymbol]();
		await waitFor(() => patches.length === 1 && rowRequests.includes(2));

		expect(patches[0]).toEqual([
			{ op: 'add', path: '/[1]', value: { id: 1 } }
		]);
		expect(db.journal.session.status).toBe('stream-pending');

		secondRows.resolve(rowsResponse([{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }]));
		const result = await syncPromise;

		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }],
			[{ op: 'add', path: '/[2]', value: { id: 2 } }]
		]);
		expect(result.applied).toBe(2);
		expect(result.__orangePullJournal.items.map(item => item.pk[0])).toEqual([1, 2]);
		expect(db.queryLog.some(sql =>
			/SELECT "batch_no", "seq", "table_name"/u.test(sql)
			&& /ORDER BY "batch_no"/u.test(sql)
		)).toBe(false);
	});

	test('defers stable-base maintenance until streamed bootstrap completes', async () => {
		const patches = [];
		const batchProgress = [];
		const stagingSummaries = [];
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
						return request.data.token
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
					return rowsResponse(request.data.items);
				};
			}
		});

		const result = await client[syncAndCapturePullJournalSymbol]({
			_deferStableBaseUntilComplete: true,
			_onPullBatchProgress: progress => batchProgress.push(progress),
			_onPullStagingSummary: summary => stagingSummaries.push(summary)
		});

		expect(result.applied).toBe(2);
		expect(patches).toHaveLength(2);
		expect(db.queryLog.some(sql =>
			/^DELETE FROM "orange_sync_base_data_.*" WHERE/u.test(sql)
		)).toBe(false);
		expect(db.queryLog.some(sql =>
			/^INSERT INTO "orange_sync_base_data_.*" SELECT \* FROM "customer" WHERE/u.test(sql)
		)).toBe(false);
		expect(db.queryLog.some(sql =>
			/^DELETE FROM "orange_sync_base_data_.*"$/u.test(sql)
		)).toBe(true);
		expect(db.queryLog.some(sql =>
			/^INSERT INTO "orange_sync_base_data_.*" SELECT \* FROM "customer"$/u.test(sql)
		)).toBe(true);
		expect(batchProgress).toHaveLength(2);
		expect(batchProgress.every(progress =>
			progress.deferredStableBase === true
			&& progress.stableBaseMs === 0
			&& Number.isFinite(progress.transactionMs)
		)).toBe(true);
		expect(stagingSummaries).toHaveLength(1);
		expect(stagingSummaries[0]).toMatchObject({
			batchCount: 2,
			keyCount: 2,
			rowCount: 2,
			applied: 2,
			deferredStableBase: true,
			stableBaseMs: 0
		});
	});

	test('honors streamed apply transaction limits', async () => {
		const patches = [];
		let foreignKeyChecks = 0;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 2,
					maxRowsPerBatch: 2,
					apply: {
						maxRowsPerTransaction: 1
					}
				}
			},
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
					patch: async (patch) => {
						patches.push(patch);
						return { changed: [] };
					}
				},
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => request.data.phase === 'keys'
					? {
						data: {
							phase: 'keys',
							items: [
								{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
								{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }
							],
							done: true,
							cursor: 'cursor-1'
						}
					}
					: rowsResponse(request.data.items);
			}
		});

		const result = await client[syncAndCapturePullJournalSymbol]();

		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }],
			[{ op: 'add', path: '/[2]', value: { id: 2 } }]
		]);
		expect(db.queryLog.filter(sql => /INSERT INTO "orange_sync_pull_item"/u.test(sql))).toHaveLength(2);
		expect(foreignKeyChecks).toBe(1);
		expect(result.applied).toBe(2);
	});

	test('resumes streamed capture without reapplying completed batches', async () => {
		const patches = [];
		const keyRequests = [];
		let failContinuation = true;
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
						if (failContinuation) {
							failContinuation = false;
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
					return rowsResponse(request.data.items);
				};
			}
		});

		const bootstrapOptions = { _deferStableBaseUntilComplete: true };
		await expect(client[syncAndCapturePullJournalSymbol](bootstrapOptions)).rejects.toThrow('network down');
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }]
		]);

		const result = await client[syncAndCapturePullJournalSymbol](bootstrapOptions);

		expect(keyRequests).toEqual([null, { page: 1 }, { page: 1 }]);
		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }],
			[{ op: 'add', path: '/[2]', value: { id: 2 } }]
		]);
		expect(result.applied).toBe(2);
		expect(result.__orangePullJournal.items.map(item => item.pk[0])).toEqual([1, 2]);
		expect(db.queryLog.some(sql =>
			/WHERE "scope" = .* AND "seq" > -1/u.test(sql)
			&& /LIMIT 1000/u.test(sql)
		)).toBe(true);
		expect(db.queryLog.some(sql =>
			/^INSERT INTO "orange_sync_base_data_.*" SELECT \* FROM "customer"$/u.test(sql)
		)).toBe(true);
	});

	test('retries streamed final validation without refetching or reapplying', async () => {
		const patches = [];
		let keyRequests = 0;
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
						keyRequests += 1;
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					return rowsResponse(request.data.items);
				};
			}
		});

		await expect(client[syncAndCapturePullJournalSymbol]())
			.rejects.toThrow('Foreign key validation failed after sync apply');
		expect(db.journal.session.status).toBe('stream-ready');
		expect(patches).toHaveLength(1);

		failForeignKeyCheck = false;
		const result = await client[syncAndCapturePullJournalSymbol]();

		expect(keyRequests).toBe(1);
		expect(patches).toHaveLength(1);
		expect(result.applied).toBe(1);
		expect(result.__orangePullJournal.items.map(item => item.pk[0])).toEqual([1]);
		expect(db.journal.session).toBeNull();
	});

	test('finishes a legacy captured journal with the atomic apply path', async () => {
		const patches = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false
			}
		});
		db.journal.session = {
			scope: 'customer',
			since_value: null,
			token_json: null,
			done: 1,
			final_since: '"cursor-1"',
			payload_json: null,
			reason: null,
			status: 'ready',
			next_seq: 1,
			next_batch: 1
		};
		db.journal.items.push({
			scope: 'customer',
			batch_no: 0,
			seq: 0,
			table_name: 'customer',
			pk_json: '[1]',
			key_json: null,
			op: 'U',
			row_json: '{"id":1}'
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
			applyTo() {}
		});

		const result = await client[syncAndCapturePullJournalSymbol]();

		expect(patches).toEqual([
			[{ op: 'add', path: '/[1]', value: { id: 1 } }]
		]);
		expect(result.__orangePullJournal.items.map(item => item.pk[0])).toEqual([1]);
		expect(db.queryLog.some(sql =>
			/SELECT "batch_no", "seq", "table_name"/u.test(sql)
			&& /ORDER BY "batch_no"/u.test(sql)
		)).toBe(true);
	});

	test('keeps staged row fetches full while persisting rows in order', async () => {
		const patches = [];
		const rowRequests = [];
		const rowResponses = [];
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 6,
					maxRowsPerBatch: 1,
					maxConcurrentRowRequests: 4
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
									{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' },
									{ table: 'customer', pk: [3], key: { id: 3 }, op: 'U' },
									{ table: 'customer', pk: [4], key: { id: 4 }, op: 'U' },
									{ table: 'customer', pk: [5], key: { id: 5 }, op: 'U' },
									{ table: 'customer', pk: [6], key: { id: 6 }, op: 'U' }
								],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					const deferred = newDeferred();
					const requestedItems = request.data.items;
					rowRequests.push(requestedItems.map((item) => item.pk[0]));
					rowResponses.push({ deferred, requestedItems });
					return deferred.promise;
				};
			}
		});

		const syncPromise = client.sync();
		await waitFor(() => rowResponses.length === 4);

		expect(rowRequests).toEqual([[1], [2], [3], [4]]);
		resolveRowResponse(rowResponseByPk(rowResponses, 3));
		await waitFor(() => rowRequests.length === 5);
		expect(rowRequests).toEqual([[1], [2], [3], [4], [5]]);
		expect(db.journal.items).toHaveLength(0);
		expect(db.journal.session.done).toBe(0);

		resolveRowResponse(rowResponseByPk(rowResponses, 1));
		await waitFor(() => rowRequests.length === 6);
		expect(db.journal.items).toHaveLength(0);

		resolveRowResponse(rowResponseByPk(rowResponses, 2));
		expect(db.journal.items).toHaveLength(0);

		resolveRowResponse(rowResponseByPk(rowResponses, 4));
		resolveRowResponse(rowResponseByPk(rowResponses, 5));
		resolveRowResponse(rowResponseByPk(rowResponses, 6));
		await syncPromise;

		expect(patches).toEqual([
			[
				{ op: 'add', path: '/[1]', value: { id: 1 } },
				{ op: 'add', path: '/[2]', value: { id: 2 } },
				{ op: 'add', path: '/[3]', value: { id: 3 } },
				{ op: 'add', path: '/[4]', value: { id: 4 } },
				{ op: 'add', path: '/[5]', value: { id: 5 } },
				{ op: 'add', path: '/[6]', value: { id: 6 } }
			]
		]);
	});

	test('applies staged pull chunks in server order when configured', async () => {
		const patches = [];
		let transactionId = 0;
		let foreignKeyChecks = 0;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 3,
					maxRowsPerBatch: 3,
					apply: {
						maxRowsPerTransaction: 1
					}
				}
			},
			foreignKeyCheck: () => {
				foreignKeyChecks += 1;
				return [];
			}
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer'),
				invoice: newTable('invoice')
			},
			transaction: async (fn) => {
				const txId = ++transactionId;
				return fn({
					customer: {
						patch: async (patch) => {
							patches.push({ txId, table: 'customer', patch });
							return { changed: [] };
						}
					},
					invoice: {
						patch: async (patch) => {
							patches.push({ txId, table: 'invoice', patch });
							return { changed: [] };
						}
					},
					query: db.query
				});
			}
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [
									{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' },
									{ table: 'invoice', pk: [2], key: { id: 2 }, op: 'U' },
									{ table: 'customer', pk: [3], key: { id: 3 }, op: 'U' }
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

		expect(patches.map(({ table, patch }) => ({ table, patch }))).toEqual([
			{ table: 'customer', patch: [{ op: 'add', path: '/[1]', value: { id: 1 } }] },
			{ table: 'invoice', patch: [{ op: 'add', path: '/[2]', value: { id: 2 } }] },
			{ table: 'customer', patch: [{ op: 'add', path: '/[3]', value: { id: 3 } }] }
		]);
		expect(new Set(patches.map(x => x.txId)).size).toBe(3);
		expect(foreignKeyChecks).toBe(1);
		expect(db.journal.session).toBeNull();
		expect(db.journal.items).toHaveLength(0);
	});

	test('does not timer-yield staged pull chunks when yieldMs is zero', async () => {
		let timerYields = 0;
		const originalSetTimeout = globalThis.setTimeout;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 2,
					maxRowsPerBatch: 2,
					apply: {
						maxRowsPerTransaction: 1
					}
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

		globalThis.setTimeout = function(...args) {
			timerYields += 1;
			return originalSetTimeout(...args);
		};
		try {
			await client.sync();
		}
		finally {
			globalThis.setTimeout = originalSetTimeout;
		}

		expect(timerYields).toBe(0);
	});

	test('can validate staged pull apply chunks after each transaction', async () => {
		let foreignKeyChecks = 0;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 3,
					maxRowsPerBatch: 3,
					apply: {
						maxRowsPerTransaction: 1,
						foreignKeyCheck: 'chunk'
					}
				}
			},
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

		expect(foreignKeyChecks).toBe(3);
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

	test('cleans inactive shadow base tables and legacy base state', async () => {
		const db = newJournalDb({
			__sqliteSync: { url: '/rdb', auto: false, schema: false, tables: ['customer'] },
			baseEntries: [
				{
					name: 'customer',
					base_name: 'orange_sync_base_data_customer',
					schema_sql: null,
					ordinal: 0
				},
				{
					name: 'old_customer',
					base_name: 'orange_sync_base_data_old_customer',
					schema_sql: null,
					ordinal: 1
				}
			],
			sqliteTables: [
				{ name: 'orange_sync_base_data_customer', sql: 'CREATE TABLE orange_sync_base_data_customer (id INTEGER)' },
				{ name: 'orange_sync_base_data_old_customer', sql: 'CREATE TABLE orange_sync_base_data_old_customer (id INTEGER)' },
				{ name: 'orange_sync_base_data_orphan', sql: 'CREATE TABLE orange_sync_base_data_orphan (id INTEGER)' }
			]
		});
		db.journal.state.set('__orange_sync_stable_base_snapshot_pending__', JSON.stringify({ since: true }));
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

		expect(db.journal.state.has('__orange_sync_stable_base_snapshot_pending__')).toBe(false);
		expect(db.journal.baseEntries.map(entry => entry.name)).toEqual(['customer']);
		expect(db.queryLog).toContain('DELETE FROM "orange_sync_base_tables" WHERE "name" = \'old_customer\'');
		expect(db.queryLog).toContain('DROP TABLE IF EXISTS "orange_sync_base_data_old_customer"');
		expect(db.queryLog).toContain('DROP TABLE IF EXISTS "orange_sync_base_data_orphan"');
		expect(db.queryLog).not.toContain('DROP TABLE IF EXISTS "orange_sync_base_data_customer"');
	});

	test('waits to push pending mutations until shadow base exists', async () => {
		const outbox = [{
			mutation_id: 'mutation-1',
			table_name: 'customer',
			patch_json: JSON.stringify([
				{ op: 'replace', path: '/[1]/name', value: 'After', oldValue: 'Before' }
			]),
			options_json: '{}',
			created_at_ms: 1,
			status: 'pending'
		}];
		const requests = [];
		const patches = [];
		const queryLog = [];
		const db = {
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				tables: ['customer']
			},
			queryLog,
			query: async (sql) => {
				queryLog.push(sql);
				if (/SELECT "mutation_id".*FROM "orange_sync_outbox"/u.test(sql)) {
					const statuses = mutationStatusesFromSelect(sql);
					return outbox.filter(row => statuses.has(row.status));
				}
				if (/UPDATE "orange_sync_outbox"/u.test(sql)) {
					outbox[0].status = 'pushed';
					return [];
				}
				if (/SELECT "since_value" FROM "orange_sync_state"/u.test(sql))
					return [];
				if (/SELECT "name", "base_name", "schema_sql", "ordinal" FROM "orange_sync_base_tables"/u.test(sql))
					return [];
				return [];
			}
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
					requests.push(request.data.phase);
					return {
						data: request.data.phase === 'push'
							? { phase: 'push', applied: 1, duplicates: 0, results: [{ id: 'mutation-1' }] }
							: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
					};
				};
			}
		});

		await client.sync();

		expect(requests).toEqual(['keys']);
		expect(outbox[0].status).toBe('pending');
		expect(patches).toEqual([
			[
				{ op: 'replace', path: '/[1]/name', value: 'After', oldValue: 'Before' }
			]
		]);
		expect(queryLog.some(sql => /orange_sync_base_/u.test(sql))).toBe(true);
	});

	test('drains pending mutations in a configured atomic push batch before pull', async () => {
		const outbox = [
			newPendingOutboxRow('mutation-1', 'First', 1),
			newPendingOutboxRow('mutation-2', 'Second', 2)
		];
		const requests = [];
		const db = newOutboxDb(outbox, {
			url: '/rdb',
			auto: false,
			schema: false,
			tables: ['customer'],
			push: { maxMutationsPerBatch: 10 }
		}, {
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: null,
				ordinal: 0
			}]
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'push') {
						requests.push(['push', request.data.mutations.map(mutation => mutation.id)]);
						return {
							data: {
								phase: 'push',
								applied: request.data.mutations.length,
								duplicates: 0,
								results: request.data.mutations.map(mutation => ({ id: mutation.id }))
							}
						};
					}
					requests.push([request.data.phase]);
					return { data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' } };
				};
			}
		});

		await client.sync();

		expect(requests).toEqual([
			['push', ['mutation-1', 'mutation-2']],
			['keys']
		]);
		expect(outbox).toHaveLength(0);
	});

	test('stops push drain on first failed request before pull', async () => {
		const outbox = [
			newPendingOutboxRow('mutation-1', 'First', 1),
			newPendingOutboxRow('mutation-2', 'Second', 2)
		];
		const requests = [];
		const db = newOutboxDb(outbox, {
			url: '/rdb',
			auto: false,
			schema: false,
			tables: ['customer']
		}, {
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: null,
				ordinal: 0
			}]
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'push') {
						const mutationId = request.data.mutations[0].id;
						requests.push(['push', mutationId]);
						if (mutationId === 'mutation-2') {
							const error = new Error('Request failed with status code 503');
							error.response = { status: 503, data: 'forced failure' };
							throw error;
						}
						return {
							data: {
								phase: 'push',
								applied: 1,
								duplicates: 0,
								results: [{ id: mutationId }]
							}
						};
					}
					requests.push([request.data.phase]);
					return { data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' } };
				};
			}
		});

		await expect(client.sync())
			.rejects.toThrow('Request failed with status code 503');

		expect(requests).toEqual([
			['push', 'mutation-1'],
			['push', 'mutation-2']
		]);
		expect(outbox.map(row => row.status)).toEqual(['pushed', 'pending']);
		expect(outbox[1].attempts).toBe(1);
		expect(outbox[1].last_error).toBe('Request failed with status code 503');
	});

	test('does not update shadow base while draining push batches', async () => {
		const outbox = [
			newPendingOutboxRow('mutation-1', 'First', 1),
			newPendingOutboxRow('mutation-2', 'Second', 2)
		];
		const requests = [];
		const db = newOutboxDb(outbox, {
			url: '/rdb',
			auto: false,
			schema: false,
			tables: ['customer']
		}, {
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT)',
				ordinal: 0
			}],
			sqliteTables: [{
				name: 'customer',
				sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT)'
			}]
		});
		const client = newSyncClient({
			tables: {
				customer: newTable('customer')
			},
			transaction: async (fn) => fn({
				query: db.query
			})
		}, async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase === 'push') {
						requests.push(['push', request.data.mutations.map(mutation => mutation.id)]);
						return {
							data: {
								phase: 'push',
								applied: 1,
								duplicates: 0,
								results: [{ id: request.data.mutations[0].id }]
							}
						};
					}
					requests.push([request.data.phase]);
					return { data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' } };
				};
			}
		});

		await client.sync();

		expect(requests).toEqual([
			['push', ['mutation-1']],
			['push', ['mutation-2']],
			['keys']
		]);
		expect(outbox).toHaveLength(0);
		expect(db.queryLog.some(sql => /^DELETE FROM "orange_sync_base_data_customer" WHERE/u.test(sql))).toBe(false);
		expect(db.queryLog.some(sql => /^INSERT INTO "orange_sync_base_data_customer" SELECT \* FROM "customer" WHERE/u.test(sql))).toBe(false);
	});

	test('updates shadow base from pull rows after accepted local push', async () => {
		const outbox = [{
			mutation_id: 'mutation-1',
			table_name: 'customer',
			patch_json: JSON.stringify([
				{ op: 'replace', path: '/[1]/name', value: 'After', oldValue: 'Before' }
			]),
			options_json: '{}',
			created_at_ms: 1,
			status: 'pending'
		}];
		const queryLog = [];
		const db = newJournalDb({
			__sqliteSync: { url: '/rdb', auto: false, schema: false, tables: ['customer'] },
			queryLog,
			baseEntries: [{
				name: 'customer',
				base_name: 'orange_sync_base_data_customer',
				schema_sql: 'CREATE TABLE customer (id INTEGER PRIMARY KEY, name TEXT)',
				ordinal: 0
			}]
		});
		db.query = async (sql) => {
			queryLog.push(sql);
			if (/SELECT "mutation_id".*FROM "orange_sync_outbox"/u.test(sql))
				return outbox.filter(row => row.status === 'pending');
			if (/UPDATE "orange_sync_outbox"/u.test(sql)) {
				outbox[0].status = 'pushed';
				outbox[0].pushed_at_ms = Date.now();
				return [];
			}
			if (/DELETE FROM "orange_sync_outbox"/u.test(sql) && /"status" = 'pushed'/u.test(sql)) {
				outbox.length = 0;
				return [];
			}
			return queryJournal(db.journal, sql);
		};
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
					if (request.data.phase === 'push') {
						return {
							data: { phase: 'push', applied: 1, duplicates: 0, results: [{ id: 'mutation-1' }] }
						};
					}
					if (request.data.phase === 'keys') {
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [1], key: { id: 1 }, op: 'U' }],
								done: true,
								cursor: 'cursor-1'
							}
						};
					}
					return {
						data: {
							phase: 'rows',
							items: [{
								table: 'customer',
								pk: [1],
								key: { id: 1 },
								row: { id: 1, name: 'After' },
								op: 'U'
							}]
						}
					};
				};
			}
		});

		await client.sync();

		expect(queryLog).toContain('DELETE FROM "orange_sync_base_data_customer" WHERE "id" = 1');
		expect(queryLog).toContain('INSERT INTO "orange_sync_base_data_customer" SELECT * FROM "customer" WHERE "id" = 1');
		expect(queryLog.some(sql => /CREATE TABLE "orange_sync_base_data_/u.test(sql))).toBe(false);
		expect(outbox).toHaveLength(0);
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

	test('resumes staged pull without reloading persisted batches after future row failure', async () => {
		const patches = [];
		const keyRequests = [];
		const rowRequests = [];
		let failSecondRow = true;
		const db = newJournalDb({
			__sqliteSync: {
				url: '/rdb',
				auto: false,
				schema: false,
				pull: {
					maxKeysPerBatch: 1,
					maxRowsPerBatch: 1,
					maxConcurrentRowRequests: 2
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
						return {
							data: {
								phase: 'keys',
								items: [{ table: 'customer', pk: [2], key: { id: 2 }, op: 'U' }],
								done: true,
								cursor: 'cursor-2'
							}
						};
					}
					const id = request.data.items[0].pk[0];
					rowRequests.push(request.data.items.map((item) => item.pk[0]));
					if (id === 2 && failSecondRow) {
						failSecondRow = false;
						throw new Error('row down');
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

		await expect(client.sync()).rejects.toThrow('row down');
		expect(rowRequests).toEqual([[1], [2]]);
		expect(db.journal.items).toHaveLength(1);
		expect(journalRowIds(db.journal.items)).toEqual([1]);

		await client.sync();

		expect(keyRequests).toEqual([null, { page: 1 }, { page: 1 }]);
		expect(rowRequests).toEqual([[1], [2], [2]]);
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

function newBasicSyncClient(db, requests) {
	return newSyncClient({
		transaction: async (fn) => fn({
			customer: {
				patch: async () => ({ changed: [] })
			},
			query: async () => []
		})
	}, async () => db, {
		applyTo(axios) {
			axios.request = async (request) => {
				if (Array.isArray(requests)) {
					const deferred = newDeferred();
					deferred.request = request;
					requests.push(deferred);
					return deferred.promise;
				}
				return {
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				};
			};
		}
	});
}

function newSqliteOpfsSyncDb(vfs, syncOverrides = {}) {
	const sync = {
		url: '/rdb',
		auto: false,
		tables: ['customer'],
		...syncOverrides
	};
	const pool = {
		__sqliteSync: sync,
		__orangeSyncIdentity: 'sqliteOPFS:sync-client.sqlite3',
		__orangeSqliteOPFSConnectionString: 'sync-client.sqlite3',
		__orangeSqliteOPFSRequestedVfs: 'opfs-sahpool',
		__orangeSqliteOPFSReady: Promise.resolve({ vfs })
	};
	return {
		__sqliteSync: sync,
		poolFactory: pool,
		query: async () => []
	};
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

function newPendingOutboxRow(id, name, createdAtMs) {
	return {
		mutation_id: id,
		table_name: 'customer',
		patch_json: JSON.stringify([
			{ op: 'replace', path: `/[${createdAtMs}]/name`, value: name, oldValue: 'Before' }
		]),
		options_json: '{}',
		created_at_ms: createdAtMs,
		status: 'pending',
		attempts: 0
	};
}

function newOutboxDb(outbox, syncConfig, options = {}) {
	const queryLog = [];
	const state = new Map();
	const baseEntries = (options.baseEntries || []).slice();
	const sqliteTables = (options.sqliteTables || []).slice();
	return {
		__sqliteSync: syncConfig,
		queryLog,
		query: async (sql) => {
			queryLog.push(sql);
			if (/SELECT "mutation_id".*FROM "orange_sync_outbox"/u.test(sql)) {
				const statuses = mutationStatusesFromSelect(sql);
				const limit = limitFromSelect(sql);
				return outbox
					.filter(row => statuses.has(row.status))
					.sort((a, b) => a.created_at_ms - b.created_at_ms)
					.slice(0, limit);
			}
			if (/UPDATE "orange_sync_outbox"/u.test(sql)) {
				const row = outbox.find(item => item.mutation_id === mutationIdFromWhere(sql));
				if (!row)
					return [];
				if (/SET "status" = 'pushed'/u.test(sql)) {
					row.status = 'pushed';
					row.pushed_at_ms = Date.now();
					row.result_json = '{}';
				}
				else if (/"attempts" = "attempts" \+ 1/u.test(sql)) {
					row.attempts = Number(row.attempts || 0) + 1;
					row.last_error = lastErrorFromUpdate(sql);
				}
				return [];
			}
			if (/DELETE FROM "orange_sync_outbox"/u.test(sql) && /"status" = 'pushed'/u.test(sql)) {
				for (let i = outbox.length - 1; i >= 0; i--) {
					if (outbox[i].status === 'pushed')
						outbox.splice(i, 1);
				}
				return [];
			}
			if (/SELECT "name" FROM "orange_sync_base_tables" LIMIT 1/u.test(sql))
				return baseEntries.length > 0 ? [{ name: baseEntries[0].name }] : [];
			if (/SELECT "name", "base_name", "schema_sql", "ordinal" FROM "orange_sync_base_tables"/u.test(sql))
				return baseEntries;
			if (/SELECT "name" FROM sqlite_schema/u.test(sql))
				return selectSyncBaseDataTables(sqliteTables);
			if (/SELECT "name", "sql" FROM sqlite_schema/u.test(sql))
				return sqliteTables;
			if (/DELETE FROM "orange_sync_base_tables"/u.test(sql)) {
				deleteSyncBaseEntry(baseEntries, sql);
				return [];
			}
			if (/INSERT INTO "orange_sync_base_tables"/u.test(sql)) {
				const values = parseSqlValues(sql);
				const existing = baseEntries.find(entry => entry.name === values[0]);
				const next = {
					name: values[0],
					base_name: values[1],
					schema_sql: values[2],
					ordinal: Number(values[3] || 0)
				};
				if (existing)
					Object.assign(existing, next);
				else
					baseEntries.push(next);
				return [];
			}
			if (/^DROP TABLE IF EXISTS/u.test(sql) && /orange_sync_base_data_/u.test(sql)) {
				dropSqliteTable(sqliteTables, sql);
				return [];
			}
			if (/^CREATE TABLE/u.test(sql) && /orange_sync_base_data_/u.test(sql))
				return [];
			if (/SELECT "since_value" FROM "orange_sync_state"/u.test(sql)) {
				const scope = firstSqlString(sql);
				const value = state.get(scope);
				return value === undefined ? [] : [{ since_value: value }];
			}
			if (/DELETE FROM "orange_sync_state"/u.test(sql)) {
				state.delete(firstSqlString(sql));
				return [];
			}
			if (/INSERT INTO "orange_sync_state"/u.test(sql)) {
				const values = parseSqlValues(sql);
				state.set(values[0], values[1]);
				return [];
			}
			return [];
		}
	};
}

function mutationIdFromWhere(sql) {
	const match = /WHERE "mutation_id" = '((?:''|[^'])*)'/u.exec(sql);
	return match ? match[1].replace(/''/g, '\'') : undefined;
}

function lastErrorFromUpdate(sql) {
	const match = /"last_error" = '((?:''|[^'])*)'/u.exec(sql);
	return match ? match[1].replace(/''/g, '\'') : undefined;
}

function mutationStatusesFromSelect(sql) {
	if (/"status" IN \(([^)]*)\)/u.test(sql)) {
		const values = /"status" IN \(([^)]*)\)/u.exec(sql)[1];
		return new Set(Array.from(values.matchAll(/'((?:''|[^'])*)'/gu)).map(match => match[1].replace(/''/g, '\'')));
	}
	if (/"status" = 'pushed'/u.test(sql))
		return new Set(['pushed']);
	return new Set(['pending']);
}

function limitFromSelect(sql) {
	const match = /LIMIT\s+(\d+)/ui.exec(sql);
	return match ? Number(match[1]) : 10000;
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
	if (/SELECT "name" FROM sqlite_schema/u.test(sql))
		return selectSyncBaseDataTables(journal.sqliteTables);
	if (/SELECT "name", "sql" FROM sqlite_schema/u.test(sql))
		return journal.sqliteTables;
	if (/DELETE FROM "orange_sync_base_tables"/u.test(sql)) {
		deleteSyncBaseEntry(journal.baseEntries, sql);
		return [];
	}
	if (/INSERT INTO "orange_sync_base_tables"/u.test(sql)) {
		const values = parseSqlValues(sql);
		const existing = journal.baseEntries.find(entry => entry.name === values[0]);
		const next = {
			name: values[0],
			base_name: values[1],
			schema_sql: values[2],
			ordinal: Number(values[3] || 0)
		};
		if (existing)
			Object.assign(existing, next);
		else
			journal.baseEntries.push(next);
		return [];
	}
	if (/^DROP TABLE IF EXISTS/u.test(sql) && /orange_sync_base_data_/u.test(sql)) {
		dropSqliteTable(journal.sqliteTables, sql);
		return [];
	}
	if (/^CREATE TABLE/u.test(sql) && /orange_sync_base_data_/u.test(sql))
		return [];
	if (/SELECT "since_value" FROM "orange_sync_state"/u.test(sql)) {
		const scope = firstSqlString(sql);
		const value = journal.state.get(scope);
		return value === undefined ? [] : [{ since_value: value }];
	}
	if (/DELETE FROM "orange_sync_state"/u.test(sql)) {
		journal.state.delete(firstSqlString(sql));
		return [];
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
		const batchMatch = /"batch_no" >= (\d+)/u.exec(sql);
		if (batchMatch) {
			const batchNo = Number(batchMatch[1]);
			journal.items = journal.items.filter(item => item.scope !== scope || item.batch_no < batchNo);
		}
		else
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

function selectSyncBaseDataTables(sqliteTables) {
	return sqliteTables
		.filter(table => typeof table.name === 'string' && table.name.startsWith('orange_sync_base_data_'))
		.map(table => ({ name: table.name }));
}

function deleteSyncBaseEntry(entries, sql) {
	if (!/WHERE "name" =/u.test(sql)) {
		entries.length = 0;
		return;
	}
	const name = firstSqlString(sql);
	for (let i = entries.length - 1; i >= 0; i--) {
		if (entries[i].name === name)
			entries.splice(i, 1);
	}
}

function dropSqliteTable(sqliteTables, sql) {
	const name = dropTableName(sql);
	if (!name)
		return;
	for (let i = sqliteTables.length - 1; i >= 0; i--) {
		if (sqliteTables[i].name === name)
			sqliteTables.splice(i, 1);
	}
}

function dropTableName(sql) {
	const match = /^DROP TABLE IF EXISTS "((?:""|[^"])*)"/u.exec(sql);
	return match ? match[1].replace(/""/g, '"') : undefined;
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
	const states = new Map();
	return {
		request(name, options, callback) {
			return new Promise((resolve, reject) => {
				let state = states.get(name);
				if (!state) {
					state = { active: false, queue: [] };
					states.set(name, state);
				}
				const entry = { callback, resolve, reject, signal: options && options.signal };
				if (entry.signal && entry.signal.aborted) {
					reject(abortError());
					return;
				}
				if (entry.signal) {
					entry.abort = () => {
						const index = state.queue.indexOf(entry);
						if (index < 0)
							return;
						state.queue.splice(index, 1);
						reject(abortError());
					};
					entry.signal.addEventListener('abort', entry.abort, { once: true });
				}
				state.queue.push(entry);
				drain(state);
			});
		}
	};

	function drain(state) {
		if (state.active)
			return;
		const entry = state.queue.shift();
		if (!entry)
			return;
		if (entry.signal && entry.abort)
			entry.signal.removeEventListener('abort', entry.abort);
		state.active = true;
		Promise.resolve()
			.then(entry.callback)
			.then(entry.resolve, entry.reject)
			.finally(() => {
				state.active = false;
				drain(state);
			});
	}

	function abortError() {
		const error = new Error('The lock request was aborted.');
		error.name = 'AbortError';
		return error;
	}
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

function resolveRowResponse(response) {
	const { deferred, requestedItems } = response;
	deferred.resolve(rowsResponse(requestedItems));
}

function rowsResponse(items) {
	return {
		data: {
			phase: 'rows',
			items: items.map((item) => ({
				table: item.table,
				pk: item.pk,
				key: item.key,
				row: { id: item.pk[0] },
				op: item.op
			}))
		}
	};
}

function rowResponseByPk(responses, id) {
	return responses.find(response => response.requestedItems.some(item => item.pk[0] === id));
}

function journalRowIds(items) {
	return items.map(item => JSON.parse(item.row_json).id);
}

function journalItems(count, firstId = 1) {
	return Array.from({ length: count }, (_item, index) => {
		const id = firstId + index;
		return {
			table: 'customer',
			pk: [id],
			key: { id },
			op: 'U',
			row: { id }
		};
	});
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(predicate) {
	for (let i = 0; i < 100; i++) {
		if (predicate())
			return;
		await wait(1);
	}
	throw new Error('Timed out waiting for condition.');
}
