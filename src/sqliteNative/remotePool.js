const { deserializeError } = require('../client/syncWorkerProtocol');

// Runs in the sync worker. Local queuing prevents a second checkout from
// overtaking release on the host's native connection queue.
module.exports = function remotePool(port) {
	if (!port) throw new Error('Missing native SQL worker port.');
	let tail = Promise.resolve(), ended = false, closing, terminal, nextId = 1;
	const pending = new Map();
	const unlocks = new Set();
	port.addEventListener('message', onMessage);
	port.addEventListener('messageerror', onError);
	port.start();
	return {
		connect,
		__orangeAcquireDatabaseAccess: () => acquire('acquire'),
		__orangeSuspendDatabase: () => request('suspend'),
		__orangeCloneDatabaseTo: target => queued(() => request('clone', target)),
		end
	};

	function request(method, ...args) {
		if (terminal) return Promise.reject(terminal);
		const id = nextId++;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			try { port.postMessage({ type: 'orange-native-request', id, method, args }); }
			catch (error) { pending.delete(id); reject(error); }
		});
	}
	function queued(fn) {
		if (ended) return Promise.reject(new Error('Native SQL worker pool closed.'));
		const result = tail.then(fn);
		tail = result.catch(() => {});
		return result;
	}
	function acquire(method) {
		if (ended) return Promise.reject(new Error('Native SQL worker pool closed.'));
		let unlock;
		const held = new Promise(resolve => { unlock = resolve; });
		const acquired = tail.then(() => request(method));
		tail = acquired.then(() => held, () => {});
		return acquired.then(() => {
			unlocks.add(unlock);
			let released;
			return () => released ||= request('release').finally(() => { unlocks.delete(unlock); unlock(); });
		});
	}
	function connect(callback) {
		acquire('checkout').then(release => {
			const executeQuery = (query, cb) => request('query', query.sql(), query.parameters || []).then(rows => cb(null, rows), error => cb(error));
			const executeCommand = (query, cb) => request('command', query.sql(), query.parameters || []).then(result => cb(null, result), error => cb(error));
			callback(null, { executeQuery, executeCommand }, () => { void release().catch(onError); });
		}, error => callback(error));
	}
	function onMessage({ data }) {
		if (!data) return;
		if (data.type === 'orange-native-terminal') { fail(deserializeError(data.error)); return; }
		if (data.type !== 'orange-native-response') return;
		const entry = pending.get(data.id);
		if (!entry) return;
		pending.delete(data.id);
		if (data.error) entry.reject(deserializeError(data.error));
		else entry.resolve(data.result);
	}
	function onError(error) { fail(error instanceof Error ? error : new Error('Native SQL worker port failed.')); }
	function fail(error) {
		if (!terminal) {
			try { port.postMessage({ type: 'orange-native-close' }); } catch (_) { /* Host already gone. */ }
		}
		terminal ||= error;
		for (const entry of pending.values()) entry.reject(terminal);
		pending.clear();
		for (const unlock of unlocks) unlock();
		unlocks.clear();
	}
	function end() {
		if (closing) return closing;
		ended = true;
		closing = tail.finally(() => {
			fail(new Error('Native SQL worker pool closed.'));
			port.removeEventListener('message', onMessage);
			port.removeEventListener('messageerror', onError);
			port.close();
		});
		return closing;
	}
};
