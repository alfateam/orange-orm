const {
	finalizeSyncOperationMemory,
	serializeSyncPayload,
	withSyncOperationMemory
} = require('../sync/operationContext');

function createDbWorkerClient(worker) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('DB worker client requires a Worker-like object.');

	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	worker.addEventListener('message', onMessage);

	const client = {
		__orangeDbWorkerClient: true,
		hostLocal,
		query: request.bind(null, 'query', {}),
		sqliteFunction: request.bind(null, 'sqliteFunction', {}),
		createTransaction,
		end: close,
		close,
		syncClient: {
			sync: syncRequest.bind(null, 'sync'),
			start: syncRequest.bind(null, 'start'),
			stop: syncRequest.bind(null, 'stop'),
			isRunning: syncRequest.bind(null, 'isRunning'),
			getConfig: syncRequest.bind(null, 'getConfig'),
			onOperation,
			on,
			off,
			once,
			waitForInitialReady: syncRequest.bind(null, 'waitForInitialReady'),
			close
		}
	};

	return client;

	function hostLocal(options = {}) {
		const tableName = options.syncTableName;
		return {
			get: requestInTransaction.bind(null, options.transaction, 'get', { tableName }),
			post: requestInTransaction.bind(null, options.transaction, 'post', { tableName }),
			patch: requestInTransaction.bind(null, options.transaction, 'patch', { tableName }),
			query: requestInTransaction.bind(null, options.transaction, 'query', {}),
			sqliteFunction: requestInTransaction.bind(null, options.transaction, 'sqliteFunction', {})
		};
	}

	function createTransaction(options) {
		const transactionId = nextId++;
		const begin = request('transaction.begin', { transactionId }, options);
		const context = { __orangeDbWorkerTransactionId: transactionId };

		async function transaction(fn) {
			await begin;
			return fn(context);
		}
		transaction.commit = async function(_context) {
			await request('transaction.commit', { transactionId });
		};
		transaction.rollback = async function(error, _context) {
			await request('transaction.rollback', { transactionId, error: serializeError(error) });
		};
		transaction.setSyncContext = async function(sync) {
			await request('transaction.syncContext', { transactionId }, serializeSyncPayload(sync));
		};
		transaction.flushSyncContext = async function(sync) {
			return request('transaction.flushSyncContext', { transactionId }, serializeSyncPayload(sync));
		};
		return transaction;
	}

	function syncRequest(method, options) {
		return request(`sync.${method}`, {}, options);
	}

	function request(method, meta, ...args) {
		const id = nextId++;
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			worker.postMessage({
				type: 'orange-db-request',
				id,
				method,
				...meta,
				args
			});
		});
	}

	function requestInTransaction(transaction, method, meta, ...args) {
		if (typeof transaction !== 'function')
			return request(method, meta, ...args);
		return transaction((context) => {
			return request(method, {
				...meta,
				transactionId: getTransactionId(context)
			}, ...args);
		});
	}

	function on(event, listener) {
		if (typeof listener !== 'function')
			return () => {};
		let eventListeners = listeners.get(event);
		if (!eventListeners) {
			eventListeners = new Set();
			listeners.set(event, eventListeners);
		}
		eventListeners.add(listener);
		request('sync.on', {}, event).catch(() => {});
		return () => off(event, listener);
	}

	function off(event, listener) {
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		eventListeners.delete(listener);
		if (eventListeners.size === 0) {
			listeners.delete(event);
			request('sync.off', {}, event).catch(() => {});
		}
	}

	function once(event, listener) {
		if (typeof listener !== 'function')
			return () => {};
		const unsubscribe = on(event, (payload) => {
			unsubscribe();
			listener(payload);
		});
		return unsubscribe;
	}

	function onOperation(operation, listener) {
		if (typeof operation !== 'string' || typeof listener !== 'function')
			return () => {};
		return on(`operation:${operation}`, listener);
	}

	function close() {
		worker.removeEventListener('message', onMessage);
		for (const entry of pending.values())
			entry.reject(new Error('DB worker client closed.'));
		pending.clear();
		listeners.clear();
		if (typeof worker.close === 'function') {
			try {
				worker.close();
			}
			catch (_e) {
				// Closing is best-effort for MessagePort-backed worker clients.
			}
		}
	}

	function onMessage(event) {
		const message = event && event.data;
		if (!message || message.type === undefined)
			return;
		if (message.type === 'orange-db-event') {
			emit(message.event, message.payload);
			return;
		}
		if (message.type !== 'orange-db-response')
			return;
		const entry = pending.get(message.id);
		if (!entry)
			return;
		pending.delete(message.id);
		if (message.error)
			entry.reject(toError(message.error));
		else
			entry.resolve(message.result);
	}

	function emit(event, payload) {
		if (event && event.startsWith && event.startsWith('operation:')) {
			payload = withSyncOperationMemory(payload);
			finalizeSyncOperationMemory(payload);
		}
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		for (const listener of Array.from(eventListeners))
			listener(payload);
	}
}

function getTransactionId(transaction) {
	return transaction && transaction.__orangeDbWorkerTransactionId;
}

function serializeError(error) {
	if (!error)
		return undefined;
	return {
		name: error.name,
		message: error.message || String(error),
		stack: error.stack
	};
}

function toError(error) {
	const e = new Error(error && error.message ? error.message : 'DB worker request failed.');
	if (error && error.name)
		e.name = error.name;
	if (error && error.stack)
		e.stack = error.stack;
	return e;
}

module.exports = createDbWorkerClient;
