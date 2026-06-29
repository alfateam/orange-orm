import { describe, expect, test } from 'vitest';

const createSyncWorkerClient = require('../src/client/syncWorkerClient');
const createSyncWorkerHandler = require('../src/client/syncWorkerHandler');

describe('sync worker rpc', () => {
	test('coalesces sync requested while sync is running into one extra sync round', async () => {
		let syncs = 0;
		const bridge = createBridge({
			sync: async () => {
				syncs += 1;
				await delay(10);
				return { synced: syncs };
			}
		});

		const client = createSyncWorkerClient(bridge.worker);
		const first = client.sync();
		const second = client.sync();

		expect(await first).toEqual({ synced: 1 });
		expect(await second).toEqual({ synced: 2 });
		expect(syncs).toBe(2);
		client.close();
	});

	test('prioritizes resetLocal before pending sync', async () => {
		const calls = [];
		let releaseSync;
		const syncStarted = new Promise((resolve) => {
			releaseSync = resolve;
		});
		const bridge = createBridge({
			sync: async () => {
				calls.push('sync');
				await syncStarted;
				return { synced: true };
			},
			resetLocal: async () => {
				calls.push('resetLocal');
				return { reset: true };
			}
		});

		const client = createSyncWorkerClient(bridge.worker);
		const firstSync = client.sync();
		const secondSync = client.sync();
		const reset = client.resetLocal();
		releaseSync();

		await firstSync;
		await reset;
		await secondSync;

		expect(calls).toEqual(['sync', 'resetLocal', 'sync']);
		client.close();
	});

	test('returns skipped result when sync is not implemented', async () => {
		const bridge = createBridge({});
		const client = createSyncWorkerClient(bridge.worker);

		await expect(client.sync()).resolves.toEqual({
			method: 'sync',
			skipped: true,
			reason: 'sync_not_implemented'
		});
		client.close();
	});

	test('auto-starts sync client when worker handler is created without config support', () => {
		let starts = 0;
		let stops = 0;
		const handler = createSyncWorkerHandler({
			start: () => {
				starts += 1;
			},
			stop: () => {
				stops += 1;
			}
		}, { postMessage: () => {} });

		expect(starts).toBe(1);
		handler.stop();
		expect(stops).toBe(1);
	});

	test('worker auto-start goes through handler queue', async () => {
		const calls = [];
		const handler = createSyncWorkerHandler({
			getConfig: async () => ({ url: '/rdb', auto: { intervalMs: 0 } }),
			sync: async () => {
				calls.push('sync');
				return { synced: true };
			},
			stop: () => {
				calls.push('stop');
			}
		}, { postMessage: () => {} });

		await delay(0);
		handler.stop();

		expect(calls).toEqual(['sync']);
	});

	test('can disable worker auto-start', () => {
		let starts = 0;
		createSyncWorkerHandler({
			start: () => {
				starts += 1;
			}
		}, { postMessage: () => {}, autoStart: false });

		expect(starts).toBe(0);
	});

	test('proxies operation events from sync worker', async () => {
		const listeners = new Map();
		const bridge = createBridge({
			on(event, listener) {
				listeners.set(event, listener);
				return () => listeners.delete(event);
			}
		});
		const client = createSyncWorkerClient(bridge.worker);
		const events = [];

		client.onOperation('worker-op', event => events.push(event));
		await delay(0);
		listeners.get('operation:worker-op')({
			ok: true,
			operation: 'worker-op',
			mutationId: 'm1',
			context: { operation: 'worker-op' },
			result: { id: 'm1' },
			retryable: false
		});
		await delay(0);
		client.close();

		expect(events).toHaveLength(1);
		expect(events[0].ok).toBe(true);
		expect(events[0].operation).toBe('worker-op');
	});
});

function createBridge(syncClient) {
	const uiListeners = new Set();
	const handler = createSyncWorkerHandler(syncClient, {
		postMessage(message) {
			for (const listener of Array.from(uiListeners)) {
				listener({ data: message });
			}
		}
	});

	return {
		worker: {
			postMessage(message) {
				void handler.handleMessage({ data: message });
			},
			addEventListener(event, listener) {
				if (event === 'message')
					uiListeners.add(listener);
			},
			removeEventListener(event, listener) {
				if (event === 'message')
					uiListeners.delete(listener);
			}
		}
	};
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
