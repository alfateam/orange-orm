/* eslint-env browser */
import orange from 'orange-orm';

const params = new URLSearchParams(location.search);
const map = orange.map(({ table }) => ({
	project: table('project').map(({ column }) => ({
		id: column('id').string().primary().notNull(),
		title: column('title').string().notNull()
	}))
}));
const vfs = params.get('vfs') || 'opfs-sahpool';
const plain = map({ db: con => con.sqliteOPFS('plain.sqlite3', { vfs }) });
let synced;
window.fixture = {
	async checkModuleOverride() {
		const worker = orange.createSqliteOPFSWorker({
			sqliteModuleUrl: new URL('./custom-sqlite.mjs', import.meta.url).href
		});
		const custom = map({ db: con => con.sqliteOPFS('custom.sqlite3', { worker, vfs: 'opfs-wl' }) });
		try { return await custom.query('SELECT 1'); }
		finally { await custom.close(); }
	},
	async writeLocal() {
		await plain.query('CREATE TABLE IF NOT EXISTS project (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
		await plain.project.insert({ id: 'local', title: 'Persistent local data' });
		return this.readLocal();
	},
	readLocal: () => plain.project.getMany(),
	openSync() {
		synced = map({
			db: con => con.sqliteOPFS('synced.sqlite3', {
				vfs,
				sync: {
					url: params.get('sync'),
					auto: { enabled: false, intervalMs: 5000 }
				}
			})
		});
	},
	sync: () => synced.syncClient.sync(),
	readSynced: () => synced.project.getMany(),
	insertSynced: (id, title) => synced.project.insert({ id, title }),
	async close() {
		await plain.close();
		if (synced)
			await synced.close();
	}
};
