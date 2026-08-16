import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const { ensureLocalSchemaReadySymbol } = require('../src/client/syncClient');
const { syncAutoStartSymbol } = require('../src/client/syncAuto');

describe('sync worker rpc', () => {
	test('starts sync from worker configuration when the handler is created', async () => {
		const calls = [];
		const bridge = createBridge({
			[syncAutoStartSymbol]: async () => {
				calls.push('startFromConfig');
			},
			start: async () => {
				calls.push('start');
			},
			stop: async () => {
				calls.push('stop');
			}
		});

		await wait(0);
		bridge.handler.stop();
		await wait(0);

		expect(calls).toEqual(['startFromConfig', 'stop']);
	});

	test('routes sync methods through a sync worker client', async () => {
		const calls = [];
		const bridge = createBridge({
			sync: async (options) => {
				calls.push(['sync', options]);
				return { ok: true };
			},
			ensureLocalSchema: async (options) => {
				calls.push(['ensureLocalSchema', options]);
				return { skipped: false, tables: ['customer'] };
			},
			[ensureLocalSchemaReadySymbol]: async () => {
				calls.push(['ensureLocalSchemaReady']);
				return { skipped: false, tables: ['customer'] };
			},
			stop: async () => {
				calls.push(['stop']);
			}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);

		const syncResult = await client.sync({ timeoutMs: 123 });
		const schemaResult = await client.ensureLocalSchema({ timeoutMs: 456 });
		const readyResult = await client[ensureLocalSchemaReadySymbol]();
		const interceptorId = client.interceptors.request.use(() => {});
		client.close();
		bridge.handler.stop();

		expect(syncResult).toEqual({ ok: true });
		expect(schemaResult).toEqual({ skipped: false, tables: ['customer'] });
		expect(readyResult).toEqual({ skipped: false, tables: ['customer'] });
		expect(interceptorId).toBe('sync-worker-noop-1');
		expect(calls).toEqual([
			['sync', { timeoutMs: 123 }],
			['ensureLocalSchema', { timeoutMs: 456 }],
			['ensureLocalSchemaReady'],
			['stop']
		]);
	});

	test('forwards sync events through a sync worker client', async () => {
		let listener;
		const bridge = createBridge({
			on(event, fn) {
				if (event === 'sync')
					listener = fn;
				return () => {
					listener = undefined;
				};
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		const events = [];

		const unsubscribe = client.on('sync', (payload) => events.push(payload));
		await wait(10);
		listener({ method: 'sync' });
		await wait(10);
		unsubscribe();
		client.close();
		bridge.handler.stop();

		expect(events).toEqual([{ method: 'sync' }]);
	});

	test('times out a sync worker request which never responds', async () => {
		const worker = {
			postMessage() {},
			addEventListener() {},
			removeEventListener() {},
			terminate() {}
		};
		const client = rdb.createSyncWorkerClient(worker, { requestTimeoutMs: 5 });

		await expect(client.sync()).rejects.toThrow('timed out');
		client.close();
	});

	test('rejects pending requests when the worker fails', async () => {
		const listeners = new Map();
		const worker = {
			postMessage() {},
			addEventListener(event, listener) {
				listeners.set(event, listener);
			},
			removeEventListener(event) {
				listeners.delete(event);
			},
			terminate() {}
		};
		const client = rdb.createSyncWorkerClient(worker);
		const pending = client.sync();
		listeners.get('error')({ message: 'worker crashed' });

		await expect(pending).rejects.toThrow('worker crashed');
		client.close();
	});

	test('preserves recovered sync metadata on worker errors', async () => {
		const syncResult = {
			__orangeDualSync: {
				activeRole: 'b',
				stagingRole: 'a',
				swapped: true
			}
		};
		const bridge = createBridge({
			async sync() {
				const error = new Error('Request failed with status code 409');
				error.status = 409;
				error.syncRecovered = true;
				error.syncResult = syncResult;
				error.mutationIds = ['mutation-1'];
				throw error;
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);

		let conflictError;
		try {
			await client.sync();
		}
		catch (error) {
			conflictError = error;
		}

		expect(conflictError).toMatchObject({
			message: 'Request failed with status code 409',
			status: 409,
			syncRecovered: true,
			syncResult,
			mutationIds: ['mutation-1']
		});
		client.close();
		bridge.handler.stop();
	});
});

function createBridge(syncClient, options = {}) {
	const uiListeners = new Set();
	const handler = rdb.createSyncWorkerHandler(syncClient, {
		...options,
		postMessage(message) {
			for (const listener of Array.from(uiListeners))
				listener({ data: message });
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
		},
		handler
	};
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
