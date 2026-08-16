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
		const uiClient = createSqliteOPFSWorkerClient('broker.sqlite3', { worker, vfs: 'opfs-wl' });
		const syncPort = connectSqliteOPFSWorker(worker);
		const syncClient = createSqliteOPFSWorkerClient('broker.sqlite3', {
			worker: syncPort,
			vfs: 'opfs-wl',
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
		const client = createSqliteOPFSWorkerClient('leased.sqlite3', { worker, vfs: 'opfs-wl' });

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

	test('serves concurrent rotated SAH-pool files through ports from one broker', async () => {
		const executed = [];
		const opened = [];
		const worker = createInlineSqliteOPFSWorker({
			sqlite3InitModule: () => newFakeSqlite3(executed, opened)
		});
		const activeClient = createSqliteOPFSWorkerClient('rotation.sqlite3', {
			worker,
			vfs: 'opfs-sahpool'
		});
		const rotatedClient = createSqliteOPFSWorkerClient('rotation.__orange_sync_c.sqlite3', {
			worker: connectSqliteOPFSWorker(worker),
			vfs: 'opfs-sahpool',
			closeDbOnClose: false
		});

		try {
			await executeWithCheckout(activeClient, 'SELECT active');
			await executeWithCheckout(rotatedClient, 'SELECT rotated');

			expect(opened).toEqual([
				'/rotation.sqlite3',
				'/rotation.__orange_sync_c.sqlite3'
			]);
			expect(executed).toEqual(['SELECT active', 'SELECT rotated']);
		}
		finally {
			await rotatedClient.close();
			await activeClient.close();
		}
	});

	test('imports a snapshot into the requested rotated database', async () => {
		const imported = [];
		const worker = createInlineSqliteOPFSWorker({
			sqlite3InitModule: () => newFakeSnapshotSqlite3(imported)
		});
		const rotatedClient = createSqliteOPFSWorkerClient('rotation.__orange_sync_c.sqlite3', {
			worker: connectSqliteOPFSWorker(worker),
			vfs: 'opfs-wl',
			closeDbOnClose: false
		});

		try {
			const lease = await rotatedClient.checkout();
			const result = await lease.importSnapshot(
				new Uint8Array([1, 2, 3]),
				['INSERT INTO project SELECT * FROM orange_snapshot.project'],
				{ schemaChecksum: 'checksum-1', rowCount: 2 }
			);
			await lease.releaseCheckout();

			expect(result).toEqual({ rowCount: 2, watermark: 9 });
			expect(imported.find(event => event.type === 'deserialize')).toMatchObject({
				filename: '/rotation.__orange_sync_c.sqlite3',
				bytes: [1, 2, 3]
			});
			expect(imported.some(event => event.statement === 'INSERT INTO project SELECT * FROM orange_snapshot.project')).toBe(true);
		}
		finally {
			await rotatedClient.close();
			worker.terminate();
		}
	});
});

async function executeWithCheckout(client, sql) {
	const lease = await client.checkout();
	try {
		await new Promise((resolve, reject) => {
			lease.executeQuery(newSql(sql), (error) => error ? reject(error) : resolve());
		});
	}
	finally {
		await client.release();
		await lease.releaseCheckout();
	}
}

function newFakeSqlite3(executed = [], opened = []) {
	return {
		async installOpfsSAHPoolVfs() {
			return {
				vfsName: 'opfs-sahpool',
				OpfsSAHPoolDb: class FakeOpfsSAHPoolDb {
					constructor(filename) {
						this.filename = filename;
						opened.push(filename);
					}

					exec(options) {
						if (typeof options === 'string')
							return undefined;
						executed.push(options.sql);
						return options.returnValue === 'resultRows' ? [{ value: 1 }] : undefined;
					}

					changes() {
						return 0;
					}

					close() {}
				}
			};
		},
		oo1: {
			OpfsDb: class FakeOpfsDb {
				constructor(filename) {
					this.filename = filename;
					opened.push(filename);
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
			},
			OpfsWlDb: class FakeOpfsWlDb {
				constructor(filename) {
					this.filename = filename;
					opened.push(filename);
				}

				exec(options) {
					if (typeof options === 'string')
						return undefined;
					executed.push(options.sql);
					return options.returnValue === 'resultRows' ? [{ value: 1 }] : undefined;
				}

				changes() {
					return 0;
				}

				close() {}
			}
		}
	};
}

function newFakeSnapshotSqlite3(imported) {
	class FakeOpfsWlDb {
		constructor(filename) {
			this.filename = filename;
			this.pointer = { filename };
		}

		exec(value) {
			if (typeof value === 'string')
				imported.push({ type: 'statement', filename: this.filename, statement: value });
			return [];
		}

		selectObject() {
			return {
				format: 1,
				schema_checksum: 'checksum-1',
				watermark_json: '9',
				row_count: 2
			};
		}

		changes() {
			return 0;
		}

		selectValue() {
			return 0;
		}

		close() {}
	}

	return {
		capi: {
			SQLITE_DESERIALIZE_FREEONCLOSE: 1,
			SQLITE_DESERIALIZE_READONLY: 4,
			sqlite3_deserialize(pointer, _schema, bytes) {
				imported.push({
					type: 'deserialize',
					filename: pointer.filename,
					bytes: Array.from(bytes)
				});
				return 0;
			}
		},
		wasm: {
			allocFromTypedArray(bytes) {
				return bytes;
			}
		},
		oo1: { OpfsWlDb: FakeOpfsWlDb }
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
