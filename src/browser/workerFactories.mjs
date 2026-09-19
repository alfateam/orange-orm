// Rollup emits these worker entries beside index.browser.mjs. Keep new URL
// directly inside new Worker: consumer bundlers need to recognize this syntax.
export function createSqliteWorker(sqliteModuleUrl) {
	if (sqliteModuleUrl) {
		const worker = new Worker(new URL('./sqlite-url-worker.mjs', import.meta.url), { type: 'module' });
		worker.postMessage({ type: 'orange-sqlite-opfs-configure', sqliteModuleUrl });
		return worker;
	}
	return new Worker(new URL('./sqlite-worker.mjs', import.meta.url), { type: 'module' });
}

export function createManagedSyncWorker() {
	return new Worker(new URL('./managed-sync-worker.mjs', import.meta.url), {
		type: 'module',
		name: 'orange-orm-sync'
	});
}
