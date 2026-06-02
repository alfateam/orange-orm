import { describe, expect, test } from 'vitest';

const createSyncWorkerClient = require('../src/client/syncWorkerClient');
const createSyncWorkerHandler = require('../src/client/syncWorkerHandler');

describe('sync worker rpc', () => {
	test('coalesces concurrent pulls into one extra pull round', async () => {
		let pulls = 0;
		const bridge = createBridge({
			pull: async () => {
				pulls += 1;
				await delay(10);
				return { pulled: pulls };
			}
		});

		const client = createSyncWorkerClient(bridge.worker);
		const first = client.pull();
		const second = client.pull();

		expect(await first).toEqual({ pulled: 2 });
		expect(await second).toEqual({ pulled: 2 });
		expect(pulls).toBe(2);
		client.close();
	});

	test('prioritizes push before pending pull', async () => {
		const calls = [];
		let releasePush;
		const pushStarted = new Promise((resolve) => {
			releasePush = resolve;
		});
		const bridge = createBridge({
			push: async () => {
				calls.push('push');
				await pushStarted;
				return { pushed: true };
			},
			pull: async () => {
				calls.push('pull');
				return { pulled: true };
			}
		});

		const client = createSyncWorkerClient(bridge.worker);
		const push = client.push();
		const pull = client.pull();
		releasePush();

		await push;
		await pull;

		expect(calls).toEqual(['push', 'pull']);
		client.close();
	});

	test('returns skipped result when pull is not implemented', async () => {
		const bridge = createBridge({});
		const client = createSyncWorkerClient(bridge.worker);

		await expect(client.pull()).resolves.toEqual({
			method: 'pull',
			skipped: true,
			reason: 'pull_not_implemented'
		});
		client.close();
	});

	test('auto-starts sync client when worker handler is created', () => {
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

	test('can disable worker auto-start', () => {
		let starts = 0;
		createSyncWorkerHandler({
			start: () => {
				starts += 1;
			}
		}, { postMessage: () => {}, autoStart: false });

		expect(starts).toBe(0);
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
