const createSyncWorkerClient = require('../client/syncWorkerClient');
const { withDeadline } = require('../client/workerDeadline');

module.exports = function createNativeManagedSync(options, helpers) {
	// Never traverse or transfer the native plugin proxy into the worker.
	const { capacitorSQLite: _plugin, ...serializableOptions } = options.poolOptions;
	const bridges = [];
	let worker, client, closing, cleanup, retirement;
	const config = helpers.normalizeWorkerConfig(options.syncConfig.worker);
	const visibility = config.visibility || options.poolOptions.lifecycle?.visibility;
	const closeTimeoutMs = Number.isFinite(config.closeTimeoutMs) && config.closeTimeoutMs > 0 ? config.closeTimeoutMs : 10000;
	function dispose() {
		if (cleanup) return cleanup;
		if (worker && !client) worker.terminate();
		cleanup = Promise.all(bridges.map(bridge => bridge.close()));
		return cleanup;
	}
	function retire(error) {
		if (retirement) return retirement;
		for (const entry of options.databases) entry.db.poolFactory.__orangeFail(error);
		// Keep native reservations until queued native work actually drains.
		retirement = dispose().then(() => Promise.all(options.databases.map(entry => entry.db.end())));
		retirement.catch(() => {});
		return retirement;
	}
	try {
		const schema = helpers.buildManagedSyncSchema(options.client, options.syncConfig);
		const sqliteOptions = helpers.toManagedSqliteOptions(serializableOptions);
		worker = helpers.createManagedWorker(config);
		const sqlConnections = options.databases.map(entry => {
			const bridge = entry.db.poolFactory.__orangeConnectNativeWorker();
			bridges.push(bridge);
			return { connectionString: entry.connectionString, port: bridge.port };
		});
		client = createSyncWorkerClient(worker, {
			requestTimeoutMs: config.requestTimeoutMs, closeTimeoutMs, visibility,
			__managedHealth: { healthCheck: config.healthCheck, visibility },
			onTerminal: retire
		});
		worker.postMessage({ type: 'orange-managed-sync-init', sqliteBackend: 'native',
			connectionString: options.connectionString, sqliteOptions, schema, sqlConnections
		}, sqlConnections.map(entry => entry.port));
	} catch (error) {
		if (client) client.__orangeFail(error);
		void dispose().finally(() => Promise.all(options.databases.map(entry => entry.db.end()))).catch(() => {});
		throw error;
	}
	const closeClient = client.close;
	client.close = function() {
		return closing ||= (async () => {
			let failure;
			try { await closeClient(); } catch (error) { failure = error; }
			const cleanupError = Object.assign(new Error('Native SQL cleanup is still draining; connections remain reserved.'), { code: 'ORANGE_NATIVE_CLEANUP_PENDING' });
			await withDeadline(failure ? retire(failure) : dispose(), closeTimeoutMs, visibility, cleanupError);
			if (failure) throw failure;
		})();
	};
	Object.defineProperty(client, '__orangeManagedSyncWorker', { value: true });
	return client;
};
