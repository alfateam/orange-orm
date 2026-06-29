import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const { runSyncMaintenance } = require('../src/sync/writeGate');

describe('shared db worker rpc', () => {
	test('shares one db client across ports and closes on last port', async () => {
		let creates = 0;
		let starts = 0;
		let stops = 0;
		let closes = 0;
		const queries = [];
		const shared = rdb.createSharedDbWorkerHandler(() => {
			creates += 1;
			return {
				query: async (...args) => {
					queries.push(args);
					return [{ sql: args[0] }];
				},
				function: async () => null,
				close: async () => {
					closes += 1;
				},
				syncClient: {
					start: () => {
						starts += 1;
					},
					stop: () => {
						stops += 1;
					}
				}
			};
		}, { autoConnect: false });
		const first = connect(shared);
		const second = connect(shared);

		await expect(first.client.query('SELECT 1')).resolves.toEqual([{ sql: 'SELECT 1' }]);
		await expect(second.client.query('SELECT 2')).resolves.toEqual([{ sql: 'SELECT 2' }]);

		expect(creates).toBe(1);
		expect(starts).toBe(1);
		expect(queries).toEqual([['SELECT 1'], ['SELECT 2']]);

		first.client.close();
		await delay(0);
		expect(stops).toBe(0);
		expect(closes).toBe(0);

		await expect(second.client.query('SELECT 3')).resolves.toEqual([{ sql: 'SELECT 3' }]);
		second.client.close();
		await waitUntil(() => stops === 1 && closes === 1);
	});

	test('keeps sync write gate held by a transaction from one port', async () => {
		const pool = createFakeWorkerPool();
		const shared = rdb.createSharedDbWorkerHandler(() => ({
			db: pool,
			syncClient: {
				start: () => {},
				stop: () => {}
			}
		}), { autoConnect: false });
		const first = connect(shared);
		const second = connect(shared);
		const transaction = first.client.createTransaction({});

		await transaction(async () => {});
		const events = [];
		const maintenance = runSyncMaintenance(pool, async () => {
			events.push('maintenance');
		});
		await delay(0);

		expect(events).toEqual([]);
		await transaction.commit();
		await maintenance;

		expect(events).toEqual(['maintenance']);
		first.client.close();
		second.client.close();
	});

	test('scopes sync event subscriptions to each port', async () => {
		const listeners = new Map();
		const shared = rdb.createSharedDbWorkerHandler(() => ({
			query: async () => [],
			function: async () => null,
			syncClient: {
				start: () => {},
				stop: () => {},
				on(event, listener) {
					let entries = listeners.get(event);
					if (!entries) {
						entries = new Set();
						listeners.set(event, entries);
					}
					entries.add(listener);
					return () => entries.delete(listener);
				}
			}
		}), { autoConnect: false });
		const first = connect(shared);
		const second = connect(shared);
		const firstEvents = [];
		const secondEvents = [];

		const unsubscribeFirst = first.client.syncClient.on('sync', payload => firstEvents.push(payload));
		second.client.syncClient.on('sync', payload => secondEvents.push(payload));
		await waitUntil(() => listeners.get('sync') && listeners.get('sync').size === 2);
		emit(listeners, 'sync', { round: 1 });
		await waitUntil(() => firstEvents.length === 1 && secondEvents.length === 1);

		unsubscribeFirst();
		await waitUntil(() => listeners.get('sync').size === 1);
		emit(listeners, 'sync', { round: 2 });
		await waitUntil(() => secondEvents.length === 2);

		expect(firstEvents).toEqual([{ round: 1 }]);
		expect(secondEvents).toEqual([{ round: 1 }, { round: 2 }]);
		first.client.close();
		second.client.close();
	});
});

function connect(shared) {
	const { pagePort, workerPort } = createPortPair();
	shared.handleConnect({ ports: [workerPort] });
	return {
		client: rdb.createSharedDbWorkerClient({ port: pagePort }),
		pagePort,
		workerPort
	};
}

function createPortPair() {
	const pagePort = newFakePort();
	const workerPort = newFakePort();
	pagePort.target = workerPort;
	workerPort.target = pagePort;
	return { pagePort, workerPort };
}

function newFakePort() {
	const listeners = new Set();
	return {
		target: null,
		closed: false,
		postMessage(message) {
			const target = this.target;
			setTimeout(() => {
				if (!target || target.closed)
					return;
				for (const listener of Array.from(target.listeners))
					listener({ data: message });
			}, 0);
		},
		addEventListener(event, listener) {
			if (event === 'message')
				listeners.add(listener);
		},
		removeEventListener(event, listener) {
			if (event === 'message')
				listeners.delete(listener);
		},
		start() {},
		close() {
			this.closed = true;
			listeners.clear();
		},
		listeners
	};
}

function createFakeWorkerPool() {
	return {
		__sqliteSync: { url: '/rdb' },
		createTransaction() {
			async function transaction(fn) {
				return fn({});
			}
			transaction.commit = async () => {};
			transaction.rollback = async () => {};
			return transaction;
		},
		hostLocal() {
			throw new Error('hostLocal should not be called in this test');
		}
	};
}

function emit(listeners, event, payload) {
	for (const listener of Array.from(listeners.get(event) || []))
		listener(payload);
}

function waitUntil(predicate) {
	return new Promise((resolve, reject) => {
		const started = Date.now();
		check();
		function check() {
			if (predicate())
				return resolve();
			if (Date.now() - started > 1000)
				return reject(new Error('Timed out waiting for condition.'));
			setTimeout(check, 1);
		}
	});
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
