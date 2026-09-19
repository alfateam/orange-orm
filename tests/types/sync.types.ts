import type { DBClient, SyncInitialReadyEvent } from '../../src/map2';

type Model = {
	item: {
		columns: {
			id: { ' type': 'numeric', ' notNull': true };
		};
		primaryKey: readonly ['id'];
		relations: {};
	};
};

declare const db: DBClient<Model>;

const sqliteOPFS = db.sqliteOPFS('app.sqlite3', { sync: { url: '/rdb' } });
sqliteOPFS.syncClient.sync();

sqliteOPFS.syncClient.on('initial-ready', (event) => {
	const source: string = event.source;
	const updatedAtMs: number = event.updatedAtMs;
	const tables: string[] | undefined = event.tables;
	void source;
	void updatedAtMs;
	void tables;
});

const readiness: SyncInitialReadyEvent = {
	updatedAtMs: Date.now(),
	source: 'sync'
};
void readiness;

const sqlite = db.sqlite('app.sqlite3');
// @ts-expect-error Sync is currently public only through sqliteOPFS.
sqlite.syncClient.sync();

// Browser worker overrides stay optional and accept shared MessagePorts.
import orange = require('../../src');
declare const sqliteWorker: Worker;
declare const sqlitePort: MessagePort;
const options: orange.SqliteOPFSPoolOptions = {
	worker: sqlitePort,
	workerUrl: new URL('https://example.test/sqlite-worker.mjs'),
	sqliteModuleUrl: 'https://example.test/sqlite.mjs',
	createWorker: (connectionString, poolOptions) => {
		const filename: string = connectionString;
		const vfs: 'opfs-wl' | 'opfs-sahpool' | undefined = poolOptions.vfs;
		void filename;
		void vfs;
		return sqlitePort;
	},
	readWorker: sqliteWorker,
	createReadWorker: () => sqliteWorker,
	singleWorker: true,
	closeDbOnClose: false,
	sync: { url: '/sync', worker: { url: new URL('https://example.test/sync.mjs'), createWorker: () => sqliteWorker } }
};
const defaultWorker: Worker = orange.createSqliteOPFSWorker();
const customPort: Worker | MessagePort = orange.createSqliteOPFSWorker({ ...options, connectionString: 'app.sqlite3' });
void defaultWorker;
void customPort;
orange.connectSqliteOPFSWorker(sqlitePort);
// @ts-expect-error Worker factories must return a Worker or MessagePort.
orange.sqliteOPFS('app.sqlite3', { createWorker: () => '/worker.js' });
