import { describe, expect, test } from 'vitest';

const newPool = require('../src/sqliteOPFS/newPool');

describe('sqliteOPFS pool', () => {
	test('prewarms read client by default', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);

		expect(createdWorkers).toHaveLength(2);
		pool.end();
	});

	test('can disable read client prewarm', async () => {
		const createdWorkers = [];
		const pool = newPool('test.sqlite3', {
			prewarmRead: false,
			createWorker() {
				const worker = newFakeWorker();
				createdWorkers.push(worker);
				return worker;
			}
		});

		await wait(10);

		expect(createdWorkers).toHaveLength(1);
		pool.end();
	});
});

function newFakeWorker() {
	const listeners = new Map();
	return {
		addEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			entries.push(listener);
			listeners.set(type, entries);
		},
		removeEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			listeners.set(type, entries.filter((entry) => entry !== listener));
		},
		postMessage(message) {
			setTimeout(() => {
				for (const listener of listeners.get('message') || []) {
					listener({
						data: {
							type: 'orange-sqlite-opfs-response',
							id: message.id,
							result: { ok: true }
						}
					});
				}
			}, 0);
		},
		terminate() {}
	};
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
