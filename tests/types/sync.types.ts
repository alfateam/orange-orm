import type { DBClient, SyncInitialReadyEvent } from '../../src/map2';
import orange from '../../src';

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
const deletion: Promise<void> = orange.deleteSqliteOPFS('app.sqlite3', { vfs: 'opfs-sahpool', sync: true });
const readinessCheck: Promise<void> = orange.assertSyncReady(db);
void deletion;
void readinessCheck;

const sqliteOPFS = db.sqliteOPFS('app.sqlite3', { sync: { url: '/rdb' } });
sqliteOPFS.syncClient.sync();
sqliteOPFS.syncClient.on('sync', event => {
	const changed: boolean | undefined = event.changed;
	void changed;
});
const stopped: Promise<void> = sqliteOPFS.syncClient.stop();
const closed: Promise<void> = sqliteOPFS.syncClient.close();
void stopped;
void closed;

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

const rowSync = sqliteOPFS.item.syncById(1, { id: false });
void rowSync;
// @ts-expect-error Only configured sync clients expose syncById.
db.item.syncById(1);
// @ts-expect-error Only configured sync clients expose syncById.
sqlite.item.syncById(1);
// @ts-expect-error A partial collection cannot be synchronized.
sqliteOPFS.item.syncById(1, { limit: 1 });
// @ts-expect-error The primary key must have its mapped type.
sqliteOPFS.item.syncById('1');
