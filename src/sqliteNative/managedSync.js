const createSyncWorkerClient = require('../client/syncWorkerClient');

module.exports = function createNativeManagedSync(options, helpers) {
	// Never traverse or transfer the native plugin proxy into the worker.
	const { capacitorSQLite: _plugin, ...serializableOptions } = options.poolOptions;
	const bridges = [];
	let worker, client, closing, cleanup;
	function dispose() {
		if (cleanup) return cleanup;
		if (worker) {
			worker.removeEventListener('error', onError);
			worker.removeEventListener('messageerror', onError);
			worker.terminate();
		}
		cleanup = Promise.all(bridges.map(bridge => bridge.close()));
		return cleanup;
	}
	function onError() { void dispose().catch(() => {}); }
	try {
		const config = helpers.normalizeWorkerConfig(options.syncConfig.worker);
		const schema = helpers.buildManagedSyncSchema(options.client, options.syncConfig);
		const sqliteOptions = helpers.toManagedSqliteOptions(serializableOptions);
		worker = helpers.createManagedWorker(config);
		worker.addEventListener('error', onError);
		worker.addEventListener('messageerror', onError);
		const sqlConnections = options.databases.map(entry => {
			const bridge = entry.db.poolFactory.__orangeConnectNativeWorker();
			bridges.push(bridge);
			return { connectionString: entry.connectionString, port: bridge.port };
		});
		client = createSyncWorkerClient(worker, { requestTimeoutMs: config.requestTimeoutMs });
		worker.postMessage({ type: 'orange-managed-sync-init', sqliteBackend: 'native',
			connectionString: options.connectionString, sqliteOptions, schema, sqlConnections
		}, sqlConnections.map(entry => entry.port));
	} catch (error) {
		void dispose().finally(() => Promise.all(options.databases.map(entry => entry.db.end()))).catch(() => {});
		throw error;
	}
	const closeClient = client.close;
	client.close = function() {
		return closing ||= (async () => {
			try { await closeClient(); }
			catch (error) {
				await dispose();
				// The router's normal close aborts on this error, so clean up its
				// native pools here after rolling back abandoned worker leases.
				await Promise.all(options.databases.map(entry => entry.db.end()));
				throw error;
			} finally { await dispose(); }
		})();
	};
	Object.defineProperty(client, '__orangeManagedSyncWorker', { value: true });
	return client;
};
