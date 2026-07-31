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

	test('keeps opfs-sahpool on a single worker when separate read lane is requested', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			vfs: 'opfs-sahpool',
			singleWorker: false,
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

	test('does not reuse a provided writer worker for separate read lane', async () => {
		const writerWorker = newFakeWorker();
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			singleWorker: false,
			prewarmRead: false,
			worker: writerWorker,
			closeDbOnClose: false,
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		pool.connectRead((err, _client, done) => {
			if (err)
				throw err;
			done();
		});
		await wait(10);

		expect(createdWorkers).toHaveLength(1);
		expect(createdWorkers[0]).not.toBe(writerWorker);
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

	test('prioritizes normal writer checkouts over low-priority queued checkouts', async () => {
		const events = [];
		let releaseFirst;
		let releaseNormal;
		let releaseSync;
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
		await wait(10);

		pool.connect((err, _client, done) => {
			if (err)
				throw err;
			events.push('sync');
			releaseSync = done;
		}, 1);
		pool.connect((err, _client, done) => {
			if (err)
				throw err;
			events.push('normal');
			releaseNormal = done;
		});
		await wait(10);

		expect(events).toEqual(['first']);
		releaseFirst();
		await wait(10);

		expect(events).toEqual(['first', 'normal']);
		releaseNormal();
		await wait(10);

		expect(events).toEqual(['first', 'normal', 'sync']);
		releaseSync();
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

	test('tracks sqlite open vfs details', async () => {
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				return newFakeWorker([], (message) => message.method === 'open'
					? { opened: true, filename: '/test.sqlite3', vfs: 'opfs' }
					: { ok: true });
			}
		});

		try {
			await new Promise((resolve, reject) => {
				pool.connect((err, _client, done) => {
					done(err);
					if (err)
						return reject(err);
					resolve();
				});
			});
			const opened = await pool.__orangeSqliteOPFSReady;

			expect(opened).toMatchObject({
				filename: '/test.sqlite3',
				requestedVfs: 'opfs',
				vfs: 'opfs',
				fallback: false
			});
		}
		finally {
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

	test('defers opfs-wl open until checkout and closes it after checkout release', async () => {
		const messages = [];
		const pool = newPool('deferred-opfs-wl.sqlite3', {
			vfs: 'opfs-wl',
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(messages, (message) => message.method === 'open'
					? { opened: true, filename: '/deferred-opfs-wl.sqlite3', vfs: 'opfs-wl' }
					: { ok: true });
			}
		});

		await wait(10);
		expect(messages).toHaveLength(0);

		try {
			await new Promise((resolve, reject) => {
				pool.connect((err, client, done) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => {
						done(err);
						err ? reject(err) : resolve();
					});
				});
			});
			await wait(10);

			expect(messages.map(x => x.method)).toEqual(['open', 'checkout', 'query', 'close']);
		}
		finally {
			await pool.end();
		}
	});

	test('serializes opfs-wl access across pools before opening the database', async () => {
		const restoreLocks = installFakeWebLocks();
		const firstMessages = [];
		const secondMessages = [];
		const firstPool = newPool('shared-opfs-wl.sqlite3', {
			vfs: 'opfs-wl',
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(firstMessages, (message) => message.method === 'open'
					? { opened: true, filename: '/shared-opfs-wl.sqlite3', vfs: 'opfs-wl' }
					: { ok: true });
			}
		});
		const secondPool = newPool('shared-opfs-wl.sqlite3', {
			vfs: 'opfs-wl',
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(secondMessages, (message) => message.method === 'open'
					? { opened: true, filename: '/shared-opfs-wl.sqlite3', vfs: 'opfs-wl' }
					: { ok: true });
			}
		});

		try {
			let releaseFirst;
			await new Promise((resolve, reject) => {
				firstPool.connect((err, client, done) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err) => {
						if (err)
							return reject(err);
						releaseFirst = done;
						resolve();
					});
				});
			});

			const secondStarted = newDeferred();
			secondPool.connect((err, client, done) => {
				if (err)
					return secondStarted.reject(err);
				secondStarted.resolve();
				client.executeQuery(newSql('SELECT 2'), (err) => done(err));
			});
			await wait(10);

			expect(firstMessages.map(x => x.method)).toEqual(['open', 'checkout', 'query']);
			expect(secondMessages).toHaveLength(0);

			releaseFirst();
			await secondStarted.promise;
			await wait(10);

			expect(firstMessages.map(x => x.method)).toEqual(['open', 'checkout', 'query', 'close']);
			expect(secondMessages.map(x => x.method)).toEqual(['open', 'checkout', 'query', 'close']);
		}
		finally {
			restoreLocks();
			await firstPool.end();
			await secondPool.end();
		}
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
				pool.connect((err, client, done) => {
					if (err)
						return reject(err);
					client.executeQuery(newSql('SELECT 1'), (err, result) => {
						done(err);
						err ? reject(err) : resolve(result);
					});
				});
			});
			await wait(10);

			expect(rows).toEqual([{ value: 1 }]);
			expect(pool.__orangeSqliteOPFSVfs).toBe('opfs-wl');
			expect(pool.__orangeSqliteOPFSFallback).toBe(true);
		}
		finally {
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
			expect(pool.__orangeCrossTabWriteLock).toEqual({ enabled: true, timeoutMs: 300000 });
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

function installFakeWebLocks() {
	const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
	const queues = new Map();
	Object.defineProperty(globalThis, 'navigator', {
		configurable: true,
		value: {
			locks: {
				request(name, _options, callback) {
					const previous = queues.get(name) || Promise.resolve();
					const current = previous.then(() => callback());
					queues.set(name, current.catch(() => {}));
					return current;
				}
			}
		}
	});
	return () => {
		if (previous)
			Object.defineProperty(globalThis, 'navigator', previous);
		else
			delete globalThis.navigator;
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
