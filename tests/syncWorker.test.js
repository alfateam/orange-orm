import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const { ensureLocalSchemaReadySymbol } = require('../src/client/syncClient');

describe('sync worker rpc', () => {
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
