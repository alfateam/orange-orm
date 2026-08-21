const createSyncWorkerClient = require('./syncWorkerClient');
const { buildSyncSchema } = require('./syncSchema');

function createManagedSyncWorkerClient(options) {
	const workerConfig = normalizeWorkerConfig(options && options.syncConfig && options.syncConfig.worker);
	const schema = buildManagedSyncSchema(options.client, options.syncConfig);
	const worker = createManagedWorker(workerConfig);
	const sqlConnections = (options.databases || []).map(entry => ({
		connectionString: entry.connectionString,
		port: connectDatabase(entry.db)
	}));
	worker.postMessage({
		type: 'orange-managed-sync-init',
		connectionString: options.connectionString,
		sqliteOptions: toManagedSqliteOptions(options.poolOptions),
		schema,
		sqlConnections
	}, sqlConnections.map(entry => entry.port));
	const client = createSyncWorkerClient(worker, {
		requestTimeoutMs: workerConfig.requestTimeoutMs
	});
	Object.defineProperty(client, '__orangeManagedSyncWorker', {
		value: true,
		enumerable: false
	});
	return client;
}

function buildManagedSyncSchema(client, syncConfig) {
	const tables = resolveConfiguredTables(client, syncConfig);
	const schema = buildSyncSchema(client && client.tables, tables);
	if (!schema.tables.length)
		throw new Error('Managed sync worker requires mapped sync tables.');
	return schema;
}

function resolveConfiguredTables(client, syncConfig) {
	const pull = syncConfig && syncConfig.pull;
	if (pull && pull === Object(pull) && Array.isArray(pull.tables) && pull.tables.length > 0)
		return pull.tables;
	if (syncConfig && Array.isArray(syncConfig.tables) && syncConfig.tables.length > 0)
		return syncConfig.tables;
	return Object.keys(client && client.tables || {});
}

function createManagedWorker(config) {
	if (typeof config.createWorker === 'function')
		return config.createWorker();
	const WorkerClass = typeof Worker === 'function' ? Worker : undefined;
	if (!WorkerClass)
		throw new Error('Managed sync requires browser Worker support.');
	const url = config.url || managedSyncWorkerUrl();
	if (!url)
		throw new Error('Managed sync worker URL is unavailable in this build.');
	return new WorkerClass(url, { type: 'module', name: 'orange-orm-sync' });
}

function managedSyncWorkerUrl() {
	return typeof globalThis !== 'undefined'
		&& (globalThis.__orangeOrmManagedSyncWorkerUrl || globalThis.__orangeOrmManagedSyncWorkerURL);
}

function connectDatabase(db) {
	const pool = db && db.poolFactory;
	if (!pool || typeof pool.__orangeConnectWorkerPort !== 'function')
		throw new Error('Managed sync requires shareable sqliteOPFS workers.');
	return pool.__orangeConnectWorkerPort();
}

function normalizeWorkerConfig(value) {
	if (value === true)
		return {};
	if (!value || value !== Object(value) || Array.isArray(value))
		throw new Error('sync.worker must be true or a worker configuration object.');
	return value;
}

function toManagedSqliteOptions(poolOptions) {
	const options = cloneSerializable(poolOptions || {});
	delete options.worker;
	delete options.createWorker;
	delete options.readWorker;
	delete options.createReadWorker;
	delete options.workerUrl;
	delete options.inlineWorker;
	delete options.closeDbOnClose;
	options.singleWorker = true;
	if (options.sync && options.sync === Object(options.sync) && !Array.isArray(options.sync))
		delete options.sync.worker;
	return options;
}

function cloneSerializable(value) {
	if (Array.isArray(value))
		return value.map(cloneSerializable);
	if (!value || value !== Object(value))
		return typeof value === 'function' ? undefined : value;
	const result = {};
	for (let key in value) {
		const next = cloneSerializable(value[key]);
		if (next !== undefined)
			result[key] = next;
	}
	return result;
}

createManagedSyncWorkerClient.buildManagedSyncSchema = buildManagedSyncSchema;
createManagedSyncWorkerClient.toManagedSqliteOptions = toManagedSqliteOptions;

module.exports = createManagedSyncWorkerClient;
