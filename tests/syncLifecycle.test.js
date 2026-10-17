import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');
const createSyncLifecycle = require('../src/client/syncLifecycle');
const { awaitSyncWork, syncAbortSignalSymbol } = require('../src/client/syncAbort');
const { registerSyncOperationMemory, withSyncOperationMemory, clearSyncOperationMemory } = require('../src/sync/operationContext');
const { runWithCrossTabLock } = require('../src/sync/crossTabLock');
const tick = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
	let resolve;
	const promise = new Promise(done => { resolve = done; });
	return { promise, resolve };
}

function fixture() {
	const requests = [];
	const db = {
		__sqliteSync: { url: '/same-endpoint', auto: false, crossTabLock: false, tables: ['customer'] },
		query: async () => []
	};
	const client = newSyncClient({
		transaction: async fn => fn({ customer: { patch: async () => ({ changed: [] }) }, query: db.query })
	}, async () => db, {
		applyTo(transport) {
			transport.request = async request => {
				requests.push(request);
				return { data: { phase: 'keys', items: [], done: true, cursor: 'checkpoint' } };
			};
		}
	});
	return { client, db, requests };
}

describe('sync lifecycle isolation', () => {
	test('an abort listener cannot restart an instance while stop is entering', async () => {
		const lifecycle = createSyncLifecycle();
		let attemptedRestart;
		const entered = deferred();
		const run = lifecycle.run(options => new Promise((_resolve, reject) => {
			const signal = options[syncAbortSignalSymbol];
			signal.addEventListener('abort', () => {
				attemptedRestart = lifecycle.start(() => {}).catch(error => error);
				reject(signal.reason);
			});
			entered.resolve();
		}));
		await entered.promise;
		const settled = Promise.allSettled([run]);
		await lifecycle.stop();
		await settled;
		expect((await attemptedRestart).message).toContain('stopping');
		expect(lifecycle.active).toBe(false);
	});

	test('cancels a queued web lock without running its body later', async () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		let requestedSignal;
		let ran = false;
		Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
			request(_name, options) {
				requestedSignal = options.signal;
				return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason)));
			}
		} } });
		try {
			const controller = new AbortController();
			const queued = runWithCrossTabLock('account-A', { enabled: true, signal: controller.signal }, () => { ran = true; });
			const rejected = expect(queued).rejects.toMatchObject({ code: 'ORANGE_SYNC_ABORT' });
			controller.abort();
			await rejected;
			expect(requestedSignal.aborted).toBe(true);
			expect(ran).toBe(false);
		} finally {
			if (original) Object.defineProperty(globalThis, 'navigator', original);
			else delete globalThis.navigator;
		}
	});

	test('operation memory stays with its instance even when mutation IDs are identical', () => {
		const a = {}, b = {};
		registerSyncOperationMemory('same-id', { secret: 'A' }, a);
		registerSyncOperationMemory('same-id', { secret: 'B' }, b);
		const event = { mutationId: 'same-id' };
		expect(withSyncOperationMemory(event, a).memory).toEqual({ secret: 'A' });
		expect(withSyncOperationMemory(event, b).memory).toEqual({ secret: 'B' });
		clearSyncOperationMemory(a);
		expect(withSyncOperationMemory(event, a).memory).toBeUndefined();
		expect(withSyncOperationMemory(event, b).memory).toEqual({ secret: 'B' });
	});
	test('stop cancels a manual sync and its queued successors; late auth cannot send requests', async () => {
		const { client, requests } = fixture();
		const auth = deferred(), entered = deferred();
		const events = [];
		client.on('sync', event => events.push(event));
		const interceptor = client.interceptors.request.use(async config => {
			entered.resolve();
			await auth.promise;
			return config;
		});
		const first = client.sync();
		await entered.promise;
		const queued = [client.sync(), client.sync()];
		const results = Promise.allSettled([first, ...queued]);
		await client.stop();
		expect((await results).every(x => x.status === 'rejected' && x.reason.code === 'ORANGE_SYNC_ABORT')).toBe(true);
		await expect(client.sync()).rejects.toThrow('stopped');
		auth.resolve();
		await tick();
		expect(requests).toHaveLength(0);
		expect(events).toHaveLength(0);
		client.interceptors.request.eject(interceptor);
		await client.start();
		expect(requests).toHaveLength(1);
		expect(events).toHaveLength(1);
		await client.close();
	});

	test('stop drains storage work even after its caller has observed cancellation', async () => {
		const lifecycle = createSyncLifecycle();
		const storage = deferred(), entered = deferred();
		let committed = false;
		const operation = lifecycle.run(options => {
			entered.resolve();
			return awaitSyncWork(storage.promise.then(() => { committed = true; }), options[syncAbortSignalSymbol]);
		});
		await entered.promise;
		const rejected = expect(operation).rejects.toMatchObject({ code: 'ORANGE_SYNC_ABORT' });
		let stopped = false;
		const stopping = lifecycle.stop().then(() => { stopped = true; });
		await rejected;
		await tick();
		expect(stopped).toBe(false);
		await expect(lifecycle.start(() => {})).rejects.toThrow('stopping');
		storage.resolve();
		await stopping;
		expect(committed).toBe(true);
	});

	test('close rejects pending initial readiness and further starts/subscriptions', async () => {
		const { client } = fixture();
		const ready = client.waitForInitialSync();
		const rejected = expect(ready).rejects.toMatchObject({ code: 'ORANGE_SYNC_ABORT' });
		await tick();
		await client.close();
		await rejected;
		await expect(client.start()).rejects.toThrow('closed');
		await expect(client.ensureLocalSchema()).rejects.toThrow('closed');
		expect(() => client.on('sync', () => {})).toThrow('closed');
		await client.close();
	});

	test('closing A leaves B events, credentials and manual sync independent', async () => {
		const a = fixture(), b = fixture();
		const events = [];
		a.client.interceptors.request.use(config => ({ ...config, headers: { Authorization: 'A' } }));
		b.client.interceptors.request.use(config => ({ ...config, headers: { Authorization: 'B' } }));
		a.client.on('sync', () => events.push('A'));
		b.client.on('sync', () => events.push('B'));
		await a.client.sync();
		await a.client.close();
		await b.client.sync();
		expect(events).toEqual(['A', 'B']);
		expect(a.requests.map(x => x.headers.Authorization)).toEqual(['A']);
		expect(b.requests.map(x => x.headers.Authorization)).toEqual(['B']);
		await b.client.close();
	});
});
