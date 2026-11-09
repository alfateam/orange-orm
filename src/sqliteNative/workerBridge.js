const { serializeError } = require('../client/syncWorkerProtocol');

// Runs in the WebView. The worker gets SQL leases, never a Capacitor proxy or
// filesystem handle. A lease owns the same pool queue used by GUI transactions.
module.exports = function createWorkerBridge(pool) {
	const { port1: port, port2 } = new MessageChannel();
	let tail = Promise.resolve(), closing, stopped = false, lease;
	port.addEventListener('message', onMessage);
	port.start();
	return { port: port2, close };

	function onMessage({ data }) {
		if (!stopped && data?.type === 'orange-sqlite-health-request') {
			port.postMessage({ type: 'orange-sqlite-health-response', id: data.id });
			return;
		}
		if (data && data.type === 'orange-native-close') { void close().catch(() => {}); return; }
		if (!data || data.type !== 'orange-native-request') return;
		const work = tail.then(async () => {
			if (stopped) throw new Error('Native SQL bridge closed.');
			return dispatch(data.method, data.args || []);
		});
		tail = work.catch(() => {});
		work.then(result => reply(data.id, result), error => reply(data.id, undefined, error));
	}
	function reply(id, result, error) {
		if (stopped) return;
		try { port.postMessage({ type: 'orange-native-response', id, result, error: error && serializeError(error) }); }
		catch (_error) { void close().catch(() => {}); }
	}
	async function dispatch(method, args) {
		if (method === 'checkout' || method === 'acquire') {
			if (lease) throw new Error('Native SQL lease already held.');
			lease = method === 'acquire'
				? { release: await pool.__orangeAcquireDatabaseAccess() }
				: await new Promise((resolve, reject) => pool.connect((error, client, release) => error ? reject(error) : resolve({ client, release })));
			return;
		}
		if (method === 'release') {
			await releaseLease();
			return;
		}
		if (method === 'query' || method === 'command') {
			if (!lease || !lease.client) throw new Error('Native SQL query requires a checkout.');
			const sql = args[0].trim();
			if (/^(?:BEGIN|SAVEPOINT)\b/i.test(sql)) lease.transaction = true;
			const result = await query(lease.client, args[0], args[1], method === 'command');
			if (/^(?:COMMIT|END|ROLLBACK)\s*;?$/i.test(sql)) lease.transaction = false;
			return result;
		}
		if (method === 'suspend') {
			if (!lease || lease.client) throw new Error('Native suspend requires an access lease.');
			return pool.__orangeSuspendDatabase();
		}
		if (method === 'clone') {
			if (lease) throw new Error('Native clone cannot run within a transaction.');
			return pool.__orangeCloneDatabaseTo(args[0]);
		}
		throw new Error(`Unknown native SQL bridge method: ${method}`);
	}
	async function releaseLease() {
		if (!lease) return;
		const held = lease;
		lease = undefined;
		try {
			if (held.client && held.transaction) {
				// A normal COMMIT leaves nothing to roll back. This also protects the
				// next checkout after a failed transaction or a terminated sync worker.
				try { await query(held.client, 'ROLLBACK', []); }
				catch (error) {
					if (!/no transaction is active|no active transaction/i.test(error.message || '')) {
						try { await pool.__orangeSuspendDatabase(); }
						catch (closeError) { pool.__orangeFail(closeError); throw closeError; }
					}
				}
			}
		} finally { await held.release(); }
	}
	function close() {
		if (closing) return closing;
		stopped = true;
		port.removeEventListener('message', onMessage);
		try { port.postMessage({ type: 'orange-native-terminal', error: serializeError(new Error('Native SQL bridge closed.')) }); } catch (_) { /* Worker already gone. */ }
		closing = tail.then(releaseLease).finally(() => port.close());
		return closing;
	}
};

function query(client, sql, parameters = [], command = false) {
	return new Promise((resolve, reject) => client[command ? 'executeCommand' : 'executeQuery']({ sql: () => sql, parameters }, (error, rows) => error ? reject(error) : resolve(rows)));
}
