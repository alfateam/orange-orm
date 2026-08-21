import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const createHttpInterceptor = require('../src/client/httpInterceptor');
const { ensureLocalSchemaReadySymbol } = require('../src/client/syncClient');
const { syncAbortSignalSymbol, syncAutoStartSymbol } = require('../src/client/syncAuto');
const { registerSyncOperationMemory } = require('../src/sync/operationContext');

describe('sync worker rpc', () => {
	test('starts sync from worker configuration only after the main-thread client is ready', async () => {
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
		expect(calls).toEqual([]);

		const client = rdb.createSyncWorkerClient(bridge.worker);
		await wait(0);
		await bridge.handler.stop();
		client.close();
		await wait(0);

		expect(calls).toEqual(['startFromConfig', 'stop']);
	});

	test('applies a synchronously registered auth interceptor to the first automatic request', async () => {
		const workerInterceptors = createHttpInterceptor();
		let firstRequest;
		const bridge = createBridge({
			interceptors: workerInterceptors,
			[syncAutoStartSymbol]: async () => {
				firstRequest = await workerInterceptors.applyRequest({
					url: '/sync',
					headers: {}
				});
			},
			stop: async () => {}
		});
		const client = rdb.createSyncWorkerClient(bridge.worker);
		client.interceptors.request.use((config) => ({
			...config,
			headers: {
				...config.headers,
				Authorization: 'Bearer first-request-token'
			}
		}));

		await wait(0);
		expect(firstRequest).toMatchObject({
			headers: { Authorization: 'Bearer first-request-token' }
		});
		await bridge.handler.stop();
		client.close();
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
		expect(interceptorId).toEqual(expect.any(String));
		expect(calls).toEqual([
			['sync', { timeoutMs: 123 }],
			['ensureLocalSchema', { timeoutMs: 456 }],
			['ensureLocalSchemaReady'],
			['stop']
		]);
	});

	test('runs request interceptors registered on the main-thread client', async () => {
		const workerInterceptors = createHttpInterceptor();
		const bridge = createBridge({
			interceptors: workerInterceptors,
			async sync() {
				return workerInterceptors.applyRequest({
					url: '/sync',
					headers: { Accept: 'application/json' }
				});
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		const interceptorId = client.interceptors.request.use(async (config) => ({
			...config,
			headers: {
				...config.headers,
				Authorization: 'Bearer main-thread-token'
			}
		}));

		expect(await client.sync()).toEqual({
			url: '/sync',
			headers: {
				Accept: 'application/json',
				Authorization: 'Bearer main-thread-token'
			}
		});

		client.interceptors.request.eject(interceptorId);
		expect(await client.sync()).toEqual({
			url: '/sync',
			headers: { Accept: 'application/json' }
		});
		client.close();
		await bridge.handler.stop();
	});

	test('a new sync restarts a hanging main-thread request interceptor', async () => {
		const workerInterceptors = createHttpInterceptor();
		let tail = Promise.resolve();
		const bridge = createBridge({
			interceptors: workerInterceptors,
			sync() {
				const run = tail.then(() => workerInterceptors.applyRequest({
					url: '/sync',
					headers: {}
				}));
				tail = run.catch(() => {});
				return run;
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		let interceptorCalls = 0;
		let resolveOldAttempt;
		let markFirstAttempt;
		let markRestartedAttempt;
		const firstAttempt = new Promise(resolve => {
			markFirstAttempt = resolve;
		});
		const restartedAttempt = new Promise(resolve => {
			markRestartedAttempt = resolve;
		});
		client.interceptors.request.use((config) => {
			interceptorCalls += 1;
			if (interceptorCalls === 1) {
				markFirstAttempt();
				return new Promise(resolve => {
					resolveOldAttempt = resolve;
				});
			}
			if (interceptorCalls === 2)
				markRestartedAttempt();
			return {
				...config,
				headers: { Authorization: `Bearer attempt-${interceptorCalls}` }
			};
		});

		const firstSync = client.sync();
		await firstAttempt;
		const secondSync = client.sync();
		await restartedAttempt;

		await expect(firstSync).resolves.toMatchObject({
			headers: { Authorization: 'Bearer attempt-2' }
		});
		await expect(secondSync).resolves.toMatchObject({
			headers: { Authorization: 'Bearer attempt-3' }
		});
		resolveOldAttempt({
			url: '/sync',
			headers: { Authorization: 'Bearer obsolete-attempt' }
		});
		await wait(0);
		expect(interceptorCalls).toBe(3);

		client.close();
		await bridge.handler.stop();
	});

	test('runs response interceptors and preserves HTTP errors across the worker bridge', async () => {
		const workerInterceptors = createHttpInterceptor();
		let fail = false;
		const bridge = createBridge({
			interceptors: workerInterceptors,
			async sync() {
				const response = {
					data: { source: 'worker' },
					status: fail ? 401 : 200,
					config: { url: '/sync' }
				};
				if (!fail)
					return workerInterceptors.applyResponse(response);
				const error = new Error('Request failed with status code 401');
				error.response = response;
				error.config = response.config;
				return workerInterceptors.applyResponseError(error);
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		client.interceptors.response.use(
			(response) => ({
				...response,
				data: { ...response.data, intercepted: true }
			}),
			(error) => ({
				...error.response,
				data: { recoveredFrom: error.response.status }
			})
		);

		expect(await client.sync()).toMatchObject({
			status: 200,
			data: { source: 'worker', intercepted: true }
		});
		fail = true;
		expect(await client.sync()).toMatchObject({
			status: 401,
			data: { recoveredFrom: 401 }
		});
		client.close();
		await bridge.handler.stop();
	});

	test('preserves sync recovery details on rejected calls and error events', async () => {
		const eventClient = createEventSyncClient({
			async sync() {
				throw createRecoveredConflictError();
			}
		});
		const bridge = createBridge(eventClient, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		let rejected;
		try {
			await client.sync();
		}
		catch (error) {
			rejected = error;
		}

		expectRecoveredConflictError(rejected);

		let notified;
		client.once('error', (event) => {
			notified = event.error;
		});
		eventClient.emit('error', {
			method: 'sync',
			error: createRecoveredConflictError()
		});
		await wait(0);

		expectRecoveredConflictError(notified);
		await bridge.handler.stop();
		client.close();
	});

	test('fans out operation events without replaying stale operations', async () => {
		const eventClient = createEventSyncClient();
		const bridge = createBridge(eventClient, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		const all = [];
		const named = [];
		const memory = { localOnly: true };
		const offAll = client.on('operation', (event) => all.push(event));
		const offNamed = client.on('operation:customer-save', (event) => named.push(event));
		registerSyncOperationMemory('mutation-1', memory);

		eventClient.emit('operation', {
			ok: true,
			operation: 'customer-save',
			mutationId: 'mutation-1',
			context: {},
			result: { id: 1 },
			retryable: false
		});
		await wait(0);

		expect(all).toHaveLength(1);
		expect(named).toHaveLength(1);
		expect(all[0].memory).toBe(memory);
		expect(named[0]).toBe(all[0]);
		expect(eventClient.subscribedEvents()).not.toContain('operation:customer-save');

		offAll();
		offNamed();
		const next = [];
		client.once('operation:customer-save', (event) => next.push(event));
		await wait(0);
		expect(next).toEqual([]);

		eventClient.emit('operation', {
			ok: true,
			operation: 'customer-save',
			mutationId: 'mutation-2',
			context: {},
			result: { id: 2 },
			retryable: false
		});
		await wait(0);
		expect(next).toHaveLength(1);
		expect(next[0].mutationId).toBe('mutation-2');
		await bridge.handler.stop();
		client.close();
	});

	test('replays initial-ready but not completed sync events', async () => {
		const eventClient = createEventSyncClient();
		const bridge = createBridge(eventClient, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		await wait(0);
		eventClient.emit('initial-ready', { source: 'worker' });
		eventClient.emit('sync', { method: 'sync', result: { applied: 1 } });
		await wait(0);

		const ready = [];
		const sync = [];
		client.once('initial-ready', (event) => ready.push(event));
		client.once('sync', (event) => sync.push(event));
		await wait(0);

		expect(ready).toEqual([{ source: 'worker' }]);
		expect(sync).toEqual([]);
		eventClient.emit('sync', { method: 'sync', result: { applied: 2 } });
		await wait(0);
		expect(sync).toEqual([{ method: 'sync', result: { applied: 2 } }]);
		await bridge.handler.stop();
		client.close();
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

	test('does not use HTTP timeoutMs as a timeout for the whole worker request', async () => {
		const bridge = createBridge({
			async sync() {
				await wait(20);
				return { ok: true };
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);

		await expect(client.sync({ timeoutMs: 1 })).resolves.toEqual({ ok: true });
		client.close();
		await bridge.handler.stop();
	});

	test('cancels worker sync when an explicit RPC timeout expires', async () => {
		let cancelled = false;
		const bridge = createBridge({
			async sync(options) {
				const signal = options[syncAbortSignalSymbol];
				await new Promise((_resolve, reject) => {
					signal.addEventListener('abort', () => {
						cancelled = true;
						reject(signal.reason);
					}, { once: true });
				});
			},
			stop: async () => {}
		}, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker, { requestTimeoutMs: 5 });

		await expect(client.sync()).rejects.toThrow('timed out');
		await wait(10);
		expect(cancelled).toBe(true);
		client.close();
		await bridge.handler.stop();
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
		await expect(client.sync()).rejects.toThrow('worker crashed');
		client.close();
	});

	test('rejects calls immediately after close', async () => {
		const worker = {
			postMessage() {},
			addEventListener() {},
			removeEventListener() {},
			terminate() {}
		};
		const client = rdb.createSyncWorkerClient(worker);
		client.close();

		await expect(client.sync()).rejects.toThrow('closed');
	});

	test('isolates main-thread notification listeners', async () => {
		const eventClient = createEventSyncClient();
		const bridge = createBridge(eventClient, { autoStart: false });
		const client = rdb.createSyncWorkerClient(bridge.worker);
		const events = [];
		client.on('sync', () => {
			throw new Error('listener failed');
		});
		client.on('sync', event => events.push(event));

		eventClient.emit('sync', { method: 'sync' });
		await wait(0);

		expect(events).toEqual([{ method: 'sync' }]);
		client.close();
		await bridge.handler.stop();
	});
});

function createBridge(syncClient, options = {}) {
	const uiListeners = new Set();
	const handler = rdb.createSyncWorkerHandler(syncClient, {
		...options,
		postMessage(message) {
			message = cloneMessage(message);
			enqueue(() => {
				for (const listener of Array.from(uiListeners))
					listener({ data: message });
			});
		}
	});

	return {
		worker: {
			postMessage(message) {
				message = cloneMessage(message);
				enqueue(() => {
					void handler.handleMessage({ data: message });
				});
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

function createEventSyncClient(overrides = {}) {
	const listeners = new Map();
	return {
		...overrides,
		on(event, listener) {
			let eventListeners = listeners.get(event);
			if (!eventListeners) {
				eventListeners = new Set();
				listeners.set(event, eventListeners);
			}
			eventListeners.add(listener);
			return () => eventListeners.delete(listener);
		},
		emit(event, payload) {
			const eventListeners = listeners.get(event);
			if (!eventListeners)
				return;
			for (const listener of Array.from(eventListeners))
				listener(payload);
		},
		subscribedEvents() {
			return Array.from(listeners.keys());
		},
		stop: overrides.stop || (async () => {})
	};
}

function createRecoveredConflictError() {
	const cause = new Error('server rejected mutation');
	cause.code = 'REMOTE_CONFLICT';
	const error = new Error('Request failed with status code 409', { cause });
	error.status = 409;
	error.code = 'SYNC_CONFLICT';
	error.response = {
		status: 409,
		data: { mutationIds: ['mutation-1'] },
		config: { url: '/sync' }
	};
	error.config = error.response.config;
	error.syncRecovered = true;
	error.syncResult = { __orangeDualSync: { swapped: true, generation: 2 } };
	error.mutationIds = ['mutation-1'];
	return error;
}

function expectRecoveredConflictError(error) {
	expect(error).toBeInstanceOf(Error);
	expect(error.message).toBe('Request failed with status code 409');
	expect(error.status).toBe(409);
	expect(error.code).toBe('SYNC_CONFLICT');
	expect(error.response).toMatchObject({ status: 409 });
	expect(error.config).toEqual({ url: '/sync' });
	expect(error.syncRecovered).toBe(true);
	expect(error.syncResult).toEqual({ __orangeDualSync: { swapped: true, generation: 2 } });
	expect(error.mutationIds).toEqual(['mutation-1']);
	expect(error.cause).toBeInstanceOf(Error);
	expect(error.cause.code).toBe('REMOTE_CONFLICT');
}

function enqueue(fn) {
	Promise.resolve().then(fn);
}

function cloneMessage(message) {
	if (typeof structuredClone === 'function')
		return structuredClone(message);
	return JSON.parse(JSON.stringify(message));
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
