const rdb = require('./managedSyncWorkerRdb');
const mapFromSyncSchema = require('./mapFromSyncSchema');

let handler;
let healthResponder;
const pendingEvents = [];

globalThis.onmessage = function(event) {
	const message = event && event.data;
	if (message && message.type === 'orange-managed-sync-init') {
		initialize(message);
		return;
	}
	if (healthResponder && healthResponder(message)) return;
	if (!handler) {
		pendingEvents.push(event);
		return;
	}
	void handler.handleMessage(event);
};

function initialize(message) {
	if (handler)
		throw new Error('Managed sync worker is already initialized.');
	const portByConnectionString = new Map(
		(message.sqlConnections || []).map(entry => [entry.connectionString, entry.port])
	);
	healthResponder = require('./managedSyncHealthResponder')([...portByConnectionString.values()], message => globalThis.postMessage(message));
	const map = mapFromSyncSchema(rdb, message.schema);
	const db = map({
		db: con => message.sqliteBackend === 'native'
			? con.sqlite(message.connectionString, {
				...message.sqliteOptions,
				__orangeNativePorts: portByConnectionString
			})
			: con.sqliteOPFS(message.connectionString, {
				...(message.sqliteOptions || {}),
				createWorker(connectionString) {
					const port = portByConnectionString.get(connectionString);
					if (!port)
						throw new Error(`Managed sync worker has no SQLite connection for "${connectionString}".`);
					return port;
				},
				closeDbOnClose: false
			})
	});
	handler = rdb.createSyncWorkerHandler(db.syncClient);
	while (pendingEvents.length > 0)
		void handler.handleMessage(pendingEvents.shift());
}
