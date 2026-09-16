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
