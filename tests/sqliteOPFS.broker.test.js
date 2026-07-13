import { describe, expect, test } from 'vitest';

const createSqliteOPFSWorkerClient = require('../src/sqliteOPFS/workerClient');
const createInlineSqliteOPFSWorker = require('../src/sqliteOPFS/inlineWorker');
const connectSqliteOPFSWorker = require('../src/sqliteOPFS/connectWorkerPort');
const rdb = require('../src/index');

describe('sqliteOPFS broker worker', () => {
	test('creates a shareable sqliteOPFS worker through the public helper', () => {
		const worker = rdb.createSqliteOPFSWorker({
			inlineWorker: true,
			sqlite3InitModule: () => newFakeSqlite3()
		});

		expect(worker).toHaveProperty('postMessage');
		worker.terminate();
	});

	test('prioritizes normal checkouts over low-priority checkouts across ports', async () => {
		const worker = createInlineSqliteOPFSWorker({
			sqlite3InitModule: () => newFakeSqlite3()
		});
		const uiClient = createSqliteOPFSWorkerClient('broker.sqlite3', { worker });
		const syncPort = connectSqliteOPFSWorker(worker);
		const syncClient = createSqliteOPFSWorkerClient('broker.sqlite3', {
			worker: syncPort,
			closeDbOnClose: false
		});
		const events = [];

		try {
			const first = await uiClient.checkout(0);
			const syncCheckout = syncClient.checkout(1).then((lease) => {
				events.push('sync');
				return lease;
			});
			await wait(10);
			const uiCheckout = uiClient.checkout().then((lease) => {
				events.push('ui');
				return lease;
			});
			await wait(10);

			expect(events).toEqual([]);
			await first.releaseCheckout();
			const uiLease = await uiCheckout;
			await wait(10);

			expect(events).toEqual(['ui']);
			await uiLease.releaseCheckout();
			const syncLease = await syncCheckout;

			expect(events).toEqual(['ui', 'sync']);
			await syncLease.releaseCheckout();
		}
		finally {
			await syncClient.close();
			await uiClient.close();
		}
	});

	test('executes leased queries through the active checkout', async () => {
		const executed = [];
		const worker = createInlineSqliteOPFSWorker({
			sqlite3InitModule: () => newFakeSqlite3(executed)
		});
		const client = createSqliteOPFSWorkerClient('leased.sqlite3', { worker });

		try {
			const lease = await client.checkout();
			const rows = await new Promise((resolve, reject) => {
				lease.executeQuery(newSql('SELECT 1'), (err, result) => err ? reject(err) : resolve(result));
			});
			await lease.releaseCheckout();

			expect(rows).toEqual([{ value: 1 }]);
			expect(executed).toContain('SELECT 1');
		}
		finally {
			await client.close();
		}
	});
});

function newFakeSqlite3(executed = []) {
	return {
		oo1: {
			OpfsDb: class FakeOpfsDb {
				constructor(filename) {
					this.filename = filename;
				}
				exec(arg) {
					if (typeof arg === 'string')
						return;
					executed.push(arg.sql);
					if (arg.returnValue === 'resultRows')
						return [{ value: 1 }];
				}
				changes() {
					return 0;
				}
				selectValue() {
					return 0;
				}
				close() {}
			}
		}
	};
}

function newSql(sql) {
	return {
		sql: () => sql,
		parameters: []
	};
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
