import { describe, expect, test } from 'vitest';

const {
	isSyncAbortError,
	syncAbortError
} = require('../src/client/syncAbort');
const {
	createSyncAuto,
	normalizeAutoConfig,
	syncAbortSignalSymbol
} = require('../src/client/syncAuto');

describe('sync auto scheduler', () => {
	test('defaults to enabled sync when sync is configured', () => {
		expect(normalizeAutoConfig({ url: '/rdb' })).toEqual({
			enabled: true,
			intervalMs: 30000
		});
	});

	test('supports auto false and enabled false', () => {
		expect(normalizeAutoConfig({ url: '/rdb', auto: false }).enabled).toBe(false);
		expect(normalizeAutoConfig({ url: '/rdb', auto: { enabled: false } }).enabled).toBe(false);
	});

	test('runs sync cycle', async () => {
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => {
				calls.push('sync');
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		await auto.start();

		expect(calls).toEqual(['sync']);
		await expect(auto.isRunning()).resolves.toBe(true);
		await auto.stop();
		await expect(auto.isRunning()).resolves.toBe(false);
	});

	test('surfaces sync failures', async () => {
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => {
				calls.push('sync');
				throw new Error('sync failed');
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		await expect(auto.start()).rejects.toThrow('sync failed');

		expect(calls).toEqual(['sync']);
		await auto.stop();
	});

	test('explicit start runs when auto is disabled', async () => {
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => calls.push('sync')
		}, async () => ({ url: '/rdb', auto: false }));
		await auto.start();
		await auto.stop();
		expect(calls).toEqual(['sync']);
	});

	test('configured start skips when auto is disabled', async () => {
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => calls.push('sync')
		}, async () => ({ url: '/rdb', auto: false }));
		const result = await auto.startFromConfig();
		await auto.stop();
		expect(result).toBeUndefined();
		expect(calls).toEqual([]);
	});

	test('explicit start does not force a running configured auto loop', async () => {
		let syncConfig = { url: '/rdb', auto: { intervalMs: 0 } };
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => calls.push('sync')
		}, async () => syncConfig);

		await auto.startFromConfig();
		syncConfig = { url: '/rdb', auto: false };
		await auto.start();
		await auto.runNow();
		await auto.stop();

		expect(calls).toEqual(['sync']);
	});

	test('coalesces overlapping run requests', async () => {
		let release;
		let syncs = 0;
		const gate = new Promise((resolve) => {
			release = resolve;
		});
		const auto = createSyncAuto({
			sync: async () => {
				syncs += 1;
				await gate;
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		const first = auto.runNow();
		const second = auto.runNow();
		release();
		await first;
		await second;

		expect(syncs).toBe(1);
	});

	test('stop cancels and waits for the initial sync to unwind', async () => {
		let signal;
		const auto = createSyncAuto({
			sync: async (options) => {
				signal = options[syncAbortSignalSymbol];
				await new Promise((_resolve, reject) => {
					signal.addEventListener('abort', () => reject(signal.reason), { once: true });
				});
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		const start = auto.start();
		await waitUntil(() => !!signal);
		await auto.stop();
		await start;

		expect(signal.aborted).toBe(true);
		await expect(auto.isRunning()).resolves.toBe(false);
	});

	test('stop waits for a later active sync without cancelling it', async () => {
		const later = newDeferred();
		let calls = 0;
		let laterSignal;
		const auto = createSyncAuto({
			sync: async (options) => {
				calls += 1;
				if (calls === 1)
					return;
				laterSignal = options[syncAbortSignalSymbol];
				await later.promise;
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		await auto.start();
		const sync = auto.runNow();
		await waitUntil(() => !!laterSignal);
		let stopped = false;
		const stop = auto.stop().then(() => {
			stopped = true;
		});
		await Promise.resolve();

		expect(stopped).toBe(false);
		expect(laterSignal.aborted).toBe(false);
		later.resolve();
		await sync;
		await stop;
		expect(stopped).toBe(true);
	});

	test('stop prevents a pending start from beginning sync after config resolves', async () => {
		const config = newDeferred();
		let syncs = 0;
		const auto = createSyncAuto({
			sync: async () => {
				syncs += 1;
			}
		}, async () => config.promise);

		const start = auto.start();
		await Promise.resolve();
		await auto.stop();
		await start;

		expect(syncs).toBe(0);
		await expect(auto.isRunning()).resolves.toBe(false);
	});

	test('does not classify an unrelated AbortError as an intentional sync stop', () => {
		const transportAbort = new Error('HTTP request timed out.');
		transportAbort.name = 'AbortError';

		expect(isSyncAbortError(transportAbort)).toBe(false);
		expect(isSyncAbortError(syncAbortError())).toBe(true);
	});

	test('passes normalized automatic sync configuration to a custom runner', async () => {
		const configs = [];
		const auto = createSyncAuto({
			sync: async () => {
				throw new Error('default sync runner should not be used');
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 5000 } }), {
			runSync: async config => configs.push(config)
		});

		await auto.start();
		await auto.stop();

		expect(configs).toEqual([{ enabled: true, intervalMs: 5000 }]);
	});

	test('restarts the interval after stop without leaving duplicate timers', async () => {
		const intervals = new Map();
		let nextIntervalId = 1;
		let syncs = 0;
		const timers = {
			setInterval(callback) {
				const id = nextIntervalId++;
				intervals.set(id, callback);
				return id;
			},
			clearInterval(id) {
				intervals.delete(id);
			}
		};
		const auto = createSyncAuto({
			sync: async () => {
				syncs += 1;
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 5000 } }), { timers });

		await auto.start();
		expect(syncs).toBe(1);
		expect(intervals.size).toBe(1);

		await auto.stop();
		expect(intervals.size).toBe(0);

		await auto.start();
		expect(syncs).toBe(2);
		expect(intervals.size).toBe(1);

		const interval = Array.from(intervals.values())[0];
		interval();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(syncs).toBe(3);
		await auto.stop();
	});
});

function newDeferred() {
	let resolve;
	let reject;
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, reject, resolve };
}

async function waitUntil(predicate) {
	for (let i = 0; i < 100; i++) {
		if (predicate())
			return;
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	throw new Error('Timed out waiting for condition.');
}
