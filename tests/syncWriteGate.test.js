import { describe, expect, test } from 'vitest';

const {
	acquireSyncWrite,
	runSyncRead,
	runSyncMaintenance,
	runSyncSwap,
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

	test('cross-context swap drains shared reads and blocks later reads', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const firstDb = createFakeCrossTabWriteDb('shared-read-swap');
			const secondDb = createFakeCrossTabWriteDb('shared-read-swap');
			const events = [];
			const firstRelease = newDeferred();
			const secondRelease = newDeferred();
			const swapRelease = newDeferred();
			firstDb.__orangeBeforeSyncWrite = async () => events.push('refresh:read');
			secondDb.__orangeBeforeSyncWrite = async () => events.push('refresh:swap');
			const firstRead = runSyncRead(firstDb, async () => {
				events.push('read:first:start');
				await firstRelease.promise;
				events.push('read:first:end');
			});
			const secondRead = runSyncRead(firstDb, async () => {
				events.push('read:second:start');
				await secondRelease.promise;
				events.push('read:second:end');
			});
			await waitUntil(() => events.includes('read:first:start') && events.includes('read:second:start'));

			const swap = runSyncSwap(secondDb, async () => {
				events.push('swap:start');
				await swapRelease.promise;
				events.push('swap:end');
			});
			await waitUntil(() => events.includes('refresh:swap'));
			await wait(0);
			const thirdRead = runSyncRead(firstDb, async () => {
				events.push('read:third');
			});
			await wait(0);

			expect(events).not.toContain('swap:start');
			expect(events).not.toContain('read:third');
			firstRelease.resolve();
			secondRelease.resolve();
			await waitUntil(() => events.includes('swap:start'));
			expect(events).not.toContain('read:third');

			swapRelease.resolve();
			await Promise.all([firstRead, secondRead, swap, thirdRead]);
			expect(events.indexOf('read:first:end')).toBeLessThan(events.indexOf('swap:start'));
			expect(events.indexOf('read:second:end')).toBeLessThan(events.indexOf('swap:start'));
			expect(events.indexOf('swap:end')).toBeLessThan(events.indexOf('read:third'));
			expect(events[events.indexOf('read:third') - 1]).toBe('refresh:read');
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
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

	test('swap waits for writes in another context and refreshes routing before the next write', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const firstDb = createFakeCrossTabWriteDb('shared-swap');
			const secondDb = createFakeCrossTabWriteDb('shared-swap');
			const events = [];
			let releaseWrite;
			firstDb.__orangeBeforeSyncWrite = async () => events.push('refresh:first');
			secondDb.__orangeBeforeSyncWrite = async () => events.push('refresh:second');
			const write = runSyncWrite(firstDb, {}, async () => {
				events.push('write:start');
				await new Promise(resolve => {
					releaseWrite = resolve;
				});
				events.push('write:end');
			});
			await waitUntil(() => events.includes('write:start'));

			const swap = runSyncSwap(secondDb, async () => {
				events.push('swap');
			});
			await wait(0);
			expect(events).toEqual(['refresh:first', 'write:start']);

			releaseWrite();
			await Promise.all([write, swap]);
			expect(events).toEqual([
				'refresh:first',
				'write:start',
				'write:end',
				'refresh:second',
				'swap'
			]);
		}
		finally {
			restoreGlobalNavigator(originalNavigator);
		}
	});

	test('refreshes routing after an acquired transaction writer lock', async () => {
		const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { locks: createFakeWebLocks() }
		});
		try {
			const db = createFakeCrossTabWriteDb('shared-acquire');
			const events = [];
			db.__orangeBeforeSyncWrite = async () => events.push('refresh');
			const release = await acquireSyncWrite(db, {});

			expect(events).toEqual(['refresh']);
			release();
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
		__orangeCrossTabWriteLock: { enabled: true, name },
		__orangeCrossTabReadLock: { enabled: true, name: `${name}:read` }
	};
}

function createFakeWebLocks() {
	const states = new Map();
	return {
		request(name, options, callback) {
			return new Promise((resolve, reject) => {
				const state = states.get(name) || { active: [], queue: [] };
				state.queue.push({
					callback,
					mode: options && options.mode === 'shared' ? 'shared' : 'exclusive',
					reject,
					resolve
				});
				states.set(name, state);
				drain(name);
			});
		}
	};

	function drain(name) {
		const state = states.get(name);
		if (!state || state.queue.length === 0)
			return;
		if (state.active.some(entry => entry.mode === 'exclusive'))
			return;
		const next = state.queue[0];
		if (next.mode === 'exclusive') {
			if (state.active.length === 0)
				start(name, state, state.queue.shift());
			return;
		}
		while (state.queue.length > 0 && state.queue[0].mode === 'shared')
			start(name, state, state.queue.shift());
	}

	function start(name, state, entry) {
		state.active.push(entry);
		Promise.resolve()
			.then(entry.callback)
			.then(entry.resolve, entry.reject)
			.finally(() => {
				state.active = state.active.filter(activeEntry => activeEntry !== entry);
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
