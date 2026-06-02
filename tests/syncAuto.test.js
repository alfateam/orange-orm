import { describe, expect, test } from 'vitest';

const { createSyncAuto, normalizeAutoConfig } = require('../src/client/syncAuto');

describe('sync auto scheduler', () => {
	test('defaults to enabled push and pull when sync is configured', () => {
		expect(normalizeAutoConfig({ url: '/rdb' })).toEqual({
			enabled: true,
			intervalMs: 30000,
			push: true,
			pull: true
		});
	});

	test('supports auto false and push/pull toggles', () => {
		expect(normalizeAutoConfig({ url: '/rdb', auto: false }).enabled).toBe(false);
		expect(normalizeAutoConfig({ url: '/rdb', auto: { push: false } })).toMatchObject({ push: false, pull: true });
		expect(normalizeAutoConfig({ url: '/rdb', auto: { pull: false } })).toMatchObject({ push: true, pull: false });
	});

	test('runs push before pull', async () => {
		const calls = [];
		const auto = createSyncAuto({
			push: async () => {
				calls.push('push');
				return { phase: 'push' };
			},
			pull: async () => {
				calls.push('pull');
				return { phase: 'pull' };
			}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		await auto.start();

		expect(calls).toEqual(['push', 'pull']);
		expect(auto.isRunning()).toBe(true);
		auto.stop();
		expect(auto.isRunning()).toBe(false);
	});

	test('can run only push or only pull', async () => {
		const pushOnlyCalls = [];
		const pushOnly = createSyncAuto({
			push: async () => pushOnlyCalls.push('push'),
			pull: async () => pushOnlyCalls.push('pull')
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0, pull: false } }));
		await pushOnly.start();
		pushOnly.stop();
		expect(pushOnlyCalls).toEqual(['push']);

		const pullOnlyCalls = [];
		const pullOnly = createSyncAuto({
			push: async () => pullOnlyCalls.push('push'),
			pull: async () => pullOnlyCalls.push('pull')
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0, push: false } }));
		await pullOnly.start();
		pullOnly.stop();
		expect(pullOnlyCalls).toEqual(['pull']);
	});

	test('coalesces overlapping run requests', async () => {
		let release;
		let pushes = 0;
		const gate = new Promise((resolve) => {
			release = resolve;
		});
		const auto = createSyncAuto({
			push: async () => {
				pushes += 1;
				await gate;
			},
			pull: async () => {}
		}, async () => ({ url: '/rdb', auto: { intervalMs: 0 } }));

		const first = auto.runNow();
		const second = auto.runNow();
		release();
		await first;
		await second;

		expect(pushes).toBe(1);
	});
});
