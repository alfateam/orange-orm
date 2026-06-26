import { describe, expect, test } from 'vitest';

const { createSyncAuto, normalizeAutoConfig } = require('../src/client/syncAuto');

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
		expect(auto.isRunning()).toBe(true);
		auto.stop();
		expect(auto.isRunning()).toBe(false);
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
		auto.stop();
	});

	test('skips when auto is disabled', async () => {
		const calls = [];
		const auto = createSyncAuto({
			sync: async () => calls.push('sync')
		}, async () => ({ url: '/rdb', auto: false }));
		const result = await auto.start();
		auto.stop();
		expect(result).toBeUndefined();
		expect(calls).toEqual([]);
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
});
