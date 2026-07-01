import { describe, expect, test } from 'vitest';

const newPool = require('../src/sqliteOPFS/newPool');
const log = require('../src/table/log');

describe('sqliteOPFS pool', () => {
	test('uses a single worker for default OPFS', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);
		pool.connectRead(() => {});
		await wait(10);

		expect(createdWorkers).toHaveLength(1);
		pool.end();
	});

	test('uses a single worker for opfs-sahpool by default', async () => {
		const createdWorkers = [];
		const messages = [];
		const pool = newPool('test.sqlite3', {
			vfs: 'opfs-sahpool',
			createWorker() {
				const worker = newFakeWorker(messages);
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);
		pool.connectRead(() => {});
		await wait(10);

		expect(createdWorkers).toHaveLength(1);
		expect(messages[0].vfs).toBe('opfs-sahpool');
		pool.end();
	});

	test('closes sqlite worker db before terminating worker', async () => {
		const messages = [];
		let terminated = false;
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(messages, () => ({ ok: true }), () => {
					terminated = true;
				});
			}
		});

		await pool.end();

		expect(messages.map(x => x.method)).toEqual(['open', 'close']);
		expect(terminated).toBe(true);
	});

	test('can opt in to separate OPFS read worker without prewarm', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			singleWorker: false,
			prewarmRead: false,
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);
		expect(createdWorkers).toHaveLength(1);
		pool.connectRead(() => {});
		await wait(10);

		expect(createdWorkers).toHaveLength(2);
		pool.end();
	});

	test('queues writer checkouts until the previous checkout is released', async () => {
		const events = [];
		let releaseFirst;
		let releaseSecond;
		const pool = newPool('test.sqlite3', {
			createWorker() {
				return newFakeWorker();
			}
		});

		pool.connect((err, _client, done) => {
			if (err)
				throw err;
			events.push('first');
			releaseFirst = done;
		});
		pool.connect((err, _client, done) => {
			if (err)
				throw err;
			events.push('second');
			releaseSecond = done;
		});
		await wait(10);

		expect(events).toEqual(['first']);
		releaseFirst();
		await wait(10);

		expect(events).toEqual(['first', 'second']);
		releaseSecond();
		pool.end();
	});

	test('emits query completion elapsed time', async () => {
		const started = [];
		const completed = [];
		const onQuery = (entry) => started.push(entry);
		const onComplete = (entry) => completed.push(entry);
		log.on('query', onQuery);
		log.on('queryComplete', onComplete);
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				return newFakeWorker();
			}
		});

		try {
			await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => err ? reject(err) : resolve());
				});
			});

			expect(completed).toHaveLength(1);
			expect(started).toHaveLength(1);
			expect(started[0]).toMatchObject({ sql: 'SELECT 1', lane: 'writer', readonly: false });
			expect(completed[0].sql).toBe('SELECT 1');
			expect(completed[0].parameters).toEqual([]);
			expect(completed[0].elapsedMs).toBeGreaterThanOrEqual(0);
			expect(completed[0].workerElapsedMs).toBeGreaterThanOrEqual(0);
			expect(completed[0]).toMatchObject({ lane: 'writer', readonly: false });
		}
		finally {
			log.off('query', onQuery);
			log.off('queryComplete', onComplete);
			pool.end();
		}
	});

	test('uses default OPFS worker open request', async () => {
		const messages = [];
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(messages);
			}
		});

		await wait(10);

		expect(messages[0].method).toBe('open');
		expect(messages[0].vfs).toBeUndefined();
		expect(messages[0].sahPool).toBeUndefined();
		pool.end();
	});

	test('emits sqlite open vfs details', async () => {
		const opened = [];
		const onOpen = (entry) => opened.push(entry);
		log.on('sqliteOpen', onOpen);
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				return newFakeWorker([], (message) => message.method === 'open'
					? { opened: true, filename: '/test.sqlite3', vfs: 'opfs' }
					: { ok: true });
			}
		});

		try {
			await pool.connect((err) => {
				if (err)
					throw err;
			});
			await wait(10);

			expect(opened).toHaveLength(1);
			expect(opened[0]).toMatchObject({
				connectionString: 'test.sqlite3',
				filename: '/test.sqlite3',
				requestedVfs: 'opfs',
				vfs: 'opfs',
				fallback: false,
				readonly: false
			});
		}
		finally {
			log.off('sqliteOpen', onOpen);
			pool.end();
		}
	});

	test('opens inline worker with OPFS enabled', async () => {
		const initConfigs = [];
		const closes = [];
		const pool = newPool('inline.sqlite3', {
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule(config) {
				initConfigs.push(config);
				return newFakeSqlite3(closes);
			}
		});

		try {
			const rows = await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
				});
			});

			expect(rows).toEqual([{ value: 1 }]);
			expect(initConfigs).toEqual([{}]);
		}
		finally {
			await pool.end();
		}
		expect(closes).toEqual(['/inline.sqlite3']);
	});

	test('opens inline worker with opfs-sahpool vfs', async () => {
		const installOptions = [];
		const closes = [];
		const pool = newPool('sahpool.sqlite3', {
			vfs: 'opfs-sahpool',
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				return newFakeSqlite3(closes, installOptions);
			}
		});

		try {
			const rows = await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
				});
			});

			expect(rows).toEqual([{ value: 1 }]);
			expect(installOptions).toEqual([{}]);
		}
		finally {
			await pool.end();
		}
		expect(closes).toEqual(['/sahpool.sqlite3']);
	});

	test('rejects opfs-sahpool when sqlite-wasm does not expose it', async () => {
		const pool = newPool('missing-sahpool.sqlite3', {
			vfs: 'opfs-sahpool',
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				return { oo1: {} };
			}
		});

		try {
			await expect(new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => err ? reject(err) : resolve());
				});
			})).rejects.toThrow('sqliteOPFS vfs "opfs-sahpool" is not available');
		}
		finally {
			await pool.end();
		}
	});

	test('opens inline worker with opfs-wl enabled', async () => {
		const closes = [];
		const pool = newPool('opfs-wl.sqlite3', {
			vfs: 'opfs-wl',
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				return newFakeSqlite3(closes);
			}
		});

		try {
			const rows = await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
				});
			});

			expect(rows).toEqual([{ value: 1 }]);
		}
		finally {
			await pool.end();
		}
		expect(closes).toEqual(['/opfs-wl.sqlite3']);
	});

	test('rejects opfs-wl when sqlite-wasm does not expose it', async () => {
		const pool = newPool('missing-opfs-wl.sqlite3', {
			vfs: 'opfs-wl',
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				const sqlite3 = newFakeSqlite3();
				delete sqlite3.oo1.OpfsWlDb;
				return sqlite3;
			}
		});

		try {
			await expect(new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => err ? reject(err) : resolve());
				});
			})).rejects.toThrow('sqliteOPFS vfs "opfs-wl" is not available');
		}
		finally {
			await pool.end();
		}
	});

	test('falls back from opfs-sahpool to opfs-wl', async () => {
		const opened = [];
		const onOpen = (entry) => opened.push(entry);
		log.on('sqliteOpen', onOpen);
		const closes = [];
		const pool = newPool('fallback-opfs-wl.sqlite3', {
			vfs: 'opfs-sahpool',
			fallbackVfs: 'opfs-wl',
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				const sqlite3 = newFakeSqlite3(closes);
				sqlite3.installOpfsSAHPoolVfs = async () => {
					throw new Error('SAH pool is locked');
				};
				return sqlite3;
			}
		});

		try {
			const rows = await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
				});
			});

			expect(rows).toEqual([{ value: 1 }]);
			expect(opened).toHaveLength(1);
			expect(opened[0]).toMatchObject({
				connectionString: 'fallback-opfs-wl.sqlite3',
				requestedVfs: 'opfs-sahpool',
				vfs: 'opfs-wl',
				fallback: true,
				fallbackVfs: 'opfs-wl',
				fallbackError: 'SAH pool is locked',
				readonly: false
			});
		}
		finally {
			log.off('sqliteOpen', onOpen);
			await pool.end();
		}
		expect(closes).toEqual(['/fallback-opfs-wl.sqlite3']);
	});

	test('uses sync sqliteOPFS defaults for sahpool fallback to opfs-wl', async () => {
		const closes = [];
		const pool = newPool('sync-default-opfs.sqlite3', {
			sync: { url: '/rdb' },
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				const sqlite3 = newFakeSqlite3(closes);
				sqlite3.installOpfsSAHPoolVfs = async () => {
					throw new Error('SAH pool is locked');
				};
				return sqlite3;
			}
		});

		try {
			const rows = await new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
				});
			});

			expect(rows).toEqual([{ value: 1 }]);
			expect(pool.__orangeSqliteOPFSRequestedVfs).toBe('opfs-sahpool');
			expect(pool.__orangeSqliteOPFSFallbackVfs).toBe('opfs-wl');
			expect(pool.__orangeCrossTabWriteLock).toEqual({ enabled: true });
		}
		finally {
			await pool.end();
		}
		expect(closes).toEqual(['/sync-default-opfs.sqlite3']);
	});

	test('does not fall back to transient sqlite when OPFS is unavailable', async () => {
		const pool = newPool('missing-opfs.sqlite3', {
			inlineWorker: true,
			prewarmRead: false,
			sqlite3InitModule() {
				return {
					oo1: {
						DB: class TransientDb {}
					}
				};
			}
		});

		try {
			await expect(new Promise((resolve, reject) => {
				pool.connect((err, client) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => err ? reject(err) : resolve());
				});
			})).rejects.toThrow('sqliteOPFS vfs "opfs" is not available');
		}
		finally {
			await pool.end();
		}
	});

});

function newFakeWorker(messages = [], getResult = () => ({ ok: true }), terminate = () => {}) {
	const listeners = new Map();
	return {
		addEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			entries.push(listener);
			listeners.set(type, entries);
		},
		removeEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			listeners.set(type, entries.filter((entry) => entry !== listener));
		},
		postMessage(message) {
			messages.push(message);
			setTimeout(() => {
				for (const listener of listeners.get('message') || []) {
					listener({
						data: {
							type: 'orange-sqlite-opfs-response',
							id: message.id,
							result: getResult(message),
							elapsedMs: 1
						}
					});
				}
			}, 0);
		},
		terminate
	};
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function newSql(sql) {
	return {
		sql: () => sql,
		parameters: []
	};
}

function newFakeSqlite3(closes = [], installOptions = []) {
	class FakeDb {
		constructor(filename) {
			this.filename = filename;
			this.changeCount = 0;
		}

		exec(options) {
			if (typeof options === 'string')
				return undefined;
			if (options && options.returnValue === 'resultRows')
				return [{ value: 1 }];
			this.changeCount += 1;
			return undefined;
		}

		changes() {
			return this.changeCount;
		}

		selectValue() {
			return 1;
		}

		close() {
			closes.push(this.filename);
		}
	}

	return {
		oo1: {
			OpfsDb: FakeDb,
			OpfsWlDb: FakeDb,
			DB: FakeDb
		},
		async installOpfsSAHPoolVfs(options) {
			installOptions.push(options);
			return {
				OpfsSAHPoolDb: FakeDb,
				vfsName: 'opfs-sahpool'
			};
		}
	};
}
