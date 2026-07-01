import { describe, expect, test } from 'vitest';

const {
	runSyncMaintenance,
	runSyncWrite
} = require('../src/sync/writeGate');
const newSyncClient = require('../src/client/syncClient');
const createDbWorkerHandler = require('../src/client/dbWorkerHandler');

describe('sync write gate', () => {
	test('maintenance waits for active writes and blocks queued writes', async () => {
		const db = { __sqliteSync: { url: '/rdb' } };
		const events = [];
		let releaseActiveWrite;
		const activeWrite = runSyncWrite(db, {}, async () => {
			events.push('write:start');
			await new Promise((resolve) => {
				releaseActiveWrite = resolve;
			});
			events.push('write:end');
		});
		await wait(0);

		const maintenance = runSyncMaintenance(db, async () => {
			events.push('maintenance');
		});
		const queuedWrite = runSyncWrite(db, {}, async () => {
			events.push('write:queued');
		});
		await wait(0);

		expect(events).toEqual(['write:start']);
		releaseActiveWrite();
		await activeWrite;
		await maintenance;
		await queuedWrite;

		expect(events).toEqual([
			'write:start',
			'write:end',
			'maintenance',
			'write:queued'
		]);
	});

	test('readonly work is not blocked by maintenance', async () => {
		const db = { __sqliteSync: { url: '/rdb' } };
		const events = [];
		let releaseMaintenance;
		const maintenance = runSyncMaintenance(db, async () => {
			events.push('maintenance:start');
			await new Promise((resolve) => {
				releaseMaintenance = resolve;
			});
			events.push('maintenance:end');
		});
		await wait(0);

		const readonly = runSyncWrite(db, { readonly: true }, async () => {
			events.push('readonly');
		});
		const write = runSyncWrite(db, {}, async () => {
			events.push('write');
		});
		await readonly;
		await wait(0);

		expect(events).toEqual(['maintenance:start', 'readonly']);
		releaseMaintenance();
		await maintenance;
		await write;

		expect(events).toEqual([
			'maintenance:start',
			'readonly',
			'maintenance:end',
			'write'
		]);
	});

	test('initial sync holds maintenance gate while bootstrap pull is in flight', async () => {
		const db = createFakeSyncDb();
		let keysRequest;
		const syncClient = newSyncClient(createFakeClient(db), async () => db, {
			applyTo(axios) {
				axios.request = async (request) => {
					if (request.data.phase !== 'keys')
						throw new Error('Unexpected sync request');
					keysRequest = newDeferred();
					return keysRequest.promise;
				};
			}
		});

		const events = [];
		const sync = syncClient.sync();
		await waitUntil(() => keysRequest);
		const write = runSyncWrite(db, {}, async () => {
			events.push('write');
		});
		await wait(0);

		expect(events).toEqual([]);
		keysRequest.resolve({
			data: { phase: 'keys', items: [], done: true, cursor: 1 }
		});
		await sync;
		await write;

		expect(events).toEqual(['write']);
	});

	test('db worker transactions hold write gate until commit', async () => {
		const pool = createFakeWorkerPool();
		const responses = [];
		const handler = createDbWorkerHandler({
			db: pool,
			syncClient: { start: () => {} }
		}, {
			autoStart: false,
			postMessage: (message) => responses.push(message)
		});
		await handler.handleMessage({
			data: {
				type: 'orange-db-request',
				id: 1,
				method: 'transaction.begin',
				transactionId: 10,
				args: [{}]
			}
		});
		await waitUntil(() => responses.length === 1);

		const events = [];
		const maintenance = runSyncMaintenance(pool, async () => {
			events.push('maintenance');
		});
		await wait(0);

		expect(events).toEqual([]);
		await handler.handleMessage({
			data: {
				type: 'orange-db-request',
				id: 2,
				method: 'transaction.commit',
				transactionId: 10,
				args: []
			}
		});
		await maintenance;

		expect(events).toEqual(['maintenance']);
	});

	test('cross-tab sqlite writer lock serializes separate db instances', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const firstDb = createFakeCrossTabWriteDb('shared');
			const secondDb = createFakeCrossTabWriteDb('shared');
			const events = [];
			let releaseFirst;
			const first = runSyncWrite(firstDb, {}, async () => {
				events.push('first:start');
				await new Promise((resolve) => {
					releaseFirst = resolve;
				});
				events.push('first:end');
			});
			await waitUntil(() => events.includes('first:start'));

			const second = runSyncWrite(secondDb, {}, async () => {
				events.push('second');
			});
			await wait(0);
			expect(events).toEqual(['first:start']);

			releaseFirst();
			await Promise.all([first, second]);
			expect(events).toEqual(['first:start', 'first:end', 'second']);
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
	});

	test('cross-tab sqlite writer lock still applies to suppressSyncOutbox writes', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const firstDb = createFakeCrossTabWriteDb('shared-suppress');
			const secondDb = createFakeCrossTabWriteDb('shared-suppress');
			const events = [];
			let releaseFirst;
			const first = runSyncWrite(firstDb, { suppressSyncOutbox: true }, async () => {
				events.push('first:start');
				await new Promise((resolve) => {
					releaseFirst = resolve;
				});
				events.push('first:end');
			});
			await waitUntil(() => events.includes('first:start'));

			const second = runSyncWrite(secondDb, { suppressSyncOutbox: true }, async () => {
				events.push('second');
			});
			await wait(0);
			expect(events).toEqual(['first:start']);

			releaseFirst();
			await Promise.all([first, second]);
			expect(events).toEqual(['first:start', 'first:end', 'second']);
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
	});
});

function createFakeSyncDb() {
	const queries = [];
	return {
		__sqliteSync: {
			url: '/rdb',
			tables: ['customer']
		},
		queries,
		async query(sql) {
			queries.push(sql);
			return [];
		}
	};
}

function createFakeClient(db) {
	const idColumn = {
		alias: 'id',
		_dbName: 'id',
		isPrimary: true,
		tsType: 'NumberColumn'
	};
	return {
		tables: {
			customer: {
				_dbName: 'customer',
				_columns: [idColumn],
				_primaryColumns: [idColumn],
				_relations: {}
			}
		},
		async transaction(fn) {
			return fn({
				query: db.query.bind(db),
				customer: {
					patch: async () => ({ changed: [] })
				},
				tables: this.tables
			});
		}
	};
}

function createFakeWorkerPool() {
	return {
		__sqliteSync: { url: '/rdb' },
		createTransaction() {
			async function transaction(fn) {
				return fn({});
			}
			transaction.commit = async () => {};
			transaction.rollback = async () => {};
			return transaction;
		},
		hostLocal() {
			throw new Error('hostLocal should not be called in this test');
		}
	};
}

function createFakeCrossTabWriteDb(name) {
	return {
		__sqliteSync: { url: '/rdb' },
		__orangeCrossTabWriteLock: { enabled: true, name }
	};
}

function createFakeWebLocks() {
	const queues = new Map();
	const active = new Set();
	return {
		request(name, _options, callback) {
			return new Promise((resolve, reject) => {
				const queue = queues.get(name) || [];
				queue.push({ callback, resolve, reject });
				queues.set(name, queue);
				drain(name);
			});
		}
	};

	function drain(name) {
		if (active.has(name))
			return;
		const queue = queues.get(name);
		const entry = queue && queue.shift();
		if (!entry)
			return;
		active.add(name);
		Promise.resolve()
			.then(entry.callback)
			.then(entry.resolve, entry.reject)
			.finally(() => {
				active.delete(name);
				drain(name);
			});
	}
}

function restoreGlobalNavigator(descriptor) {
	if (descriptor)
		Object.defineProperty(globalThis, 'navigator', descriptor);
	else
		delete globalThis.navigator;
}

function newDeferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

async function wait(ms) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(predicate) {
	for (let i = 0; i < 50; i++) {
		if (predicate())
			return;
		await wait(0);
	}
	throw new Error('Timed out waiting for condition');
}
