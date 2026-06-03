import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');

describe('sync client auto start', () => {
	test('starts automatically when sync auto config is enabled', async () => {
		const client = newSyncClient({}, async () => ({
			__sqliteSync: {
				url: '/rdb',
				auto: { intervalMs: 0, push: false, pull: false }
			}
		}), {});

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(client.isRunning()).toBe(true);
		client.stop();
		expect(client.isRunning()).toBe(false);
	});
	test('emits push and pull errors', async () => {
		const db = { __sqliteSync: { url: '/rdb', auto: false, tables: ['customer'] } };
		const client = newSyncClient({}, async () => db, {});
		await new Promise((resolve) => setTimeout(resolve, 0));
		client.stop();
		const events = [];
		client.on('error', (payload) => events.push(['error', payload.method, payload.error.message]));
		client.once('push-error', (payload) => events.push(['push-error', payload.method, payload.error.message]));
		client.on('pull-error', (payload) => events.push(['pull-error', payload.method, payload.error.message]));

		await expect(client.push({ mutations: [{ id: 'm1' }] })).rejects.toThrow();
		await expect(client.pull()).rejects.toThrow();

		expect(events.map((x) => x[0])).toEqual(['push-error', 'error', 'pull-error', 'error']);
		expect(events.map((x) => x[1])).toEqual(['push', 'push', 'pull', 'pull']);
	});
});
