import installSqliteWorker from '../sqliteOPFS/workerHandler.mjs';

// Explicit URL overrides are supplied at runtime. Their modules and assets
// are hosted by the caller; only the default worker uses a bundled import.
let sqliteModuleUrl;
self.addEventListener('message', ({ data }) => {
	if (data && data.type === 'orange-sqlite-opfs-configure')
		sqliteModuleUrl = data.sqliteModuleUrl;
});

installSqliteWorker(async () => {
	const module = await import(/* webpackIgnore: true */ /* @vite-ignore */ sqliteModuleUrl);
	const initialize = module && module.default || module;
	if (typeof initialize !== 'function')
		throw new Error(`sqliteOPFS could not load sqlite-wasm module from ${sqliteModuleUrl}.`);
	return initialize();
});
