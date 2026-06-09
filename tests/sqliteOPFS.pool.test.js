import { describe, expect, test } from 'vitest';

const newPool = require('../src/sqliteOPFS/newPool');
const log = require('../src/table/log');

describe('sqliteOPFS pool', () => {
	test('prewarms read client by default', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);

		expect(createdWorkers).toHaveLength(2);
		pool.end();
	});

	test('can disable read client prewarm', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);

		expect(createdWorkers).toHaveLength(1);
		pool.end();
	});

	test('emits query completion elapsed time', async () => {
		const completed = [];
		const onComplete = (entry) => completed.push(entry);
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
			expect(completed[0].sql).toBe('SELECT 1');
			expect(completed[0].parameters).toEqual([]);
			expect(completed[0].elapsedMs).toBeGreaterThanOrEqual(0);
			expect(completed[0].workerElapsedMs).toBeGreaterThanOrEqual(0);
		}
		finally {
			log.off('queryComplete', onComplete);
			pool.end();
		}
	});

	test('passes selected vfs to worker open request', async () => {
		const messages = [];
		const pool = newPool('test.sqlite3', {
			vfs: 'opfs-sahpool',
			sahPool: { initialCapacity: 8 },
			prewarmRead: false,
			createWorker() {
				return newFakeWorker(messages);
			}
		});

		await wait(10);

		expect(messages[0].method).toBe('open');
		expect(messages[0].vfs).toBe('opfs-sahpool');
		expect(messages[0].sahPool).toEqual({ initialCapacity: 8 });
		pool.end();
	});

	test('routes SAH pool reads through write client', async () => {
		const messages = [];
		const pool = newPool('test.sqlite3', {
			vfs: 'opfs-sahpool',
			createWorker() {
				return newFakeWorker(messages);
			}
		});

		await wait(10);
		pool.connectRead(() => {});
		await wait(10);

		expect(messages.filter(x => x.method === 'open')).toHaveLength(1);
		pool.end();
	});
});

function newFakeWorker(messages = []) {
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
							result: { ok: true },
							elapsedMs: 1
						}
					});
				}
			}, 0);
		},
		terminate() {}
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
