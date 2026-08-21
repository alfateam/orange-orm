const {
	finalizeSyncOperationMemory,
	serializeSyncPayload,
	withSyncOperationMemory
} = require('../sync/operationContext');
const createHttpInterceptor = require('./httpInterceptor');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');
const {
	deserializeError,
	deserializeEventPayload,
	isAlwaysForwardedEvent,
	serializeError
} = require('./syncWorkerProtocol');

function createDbWorkerClient(worker) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('DB worker client requires a Worker-like object.');

	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();
	const interceptors = createHttpInterceptor();
	let hasInitialReady = false;
	let lastInitialReady;
	let closed = false;
	let terminalError;

	worker.addEventListener('message', onMessage);
	worker.addEventListener('error', onWorkerError);
	worker.addEventListener('messageerror', onWorkerError);
	if (typeof worker.start === 'function')
		worker.start();

	const client = {
		__orangeDbWorkerClient: true,
		__createSyncClient,
		hostLocal,
		query: request.bind(null, 'query', {}),
		sqliteFunction: request.bind(null, 'sqliteFunction', {}),
		createTransaction,
		end: close,
		close,
		syncClient: {
			sync: syncRequest.bind(null, 'sync'),
			ensureLocalSchema: syncRequest.bind(null, 'ensureLocalSchema'),
			resetLocal: syncRequest.bind(null, 'resetLocal'),
			start: syncRequest.bind(null, 'start'),
			stop: syncRequest.bind(null, 'stop'),
			isRunning: syncRequest.bind(null, 'isRunning'),
			on,
			off,
			once,
			waitForInitialSync: syncRequest.bind(null, 'waitForInitialSync'),
			interceptors,
			[ensureLocalSchemaReadySymbol]: syncRequest.bind(null, 'ensureLocalSchemaReady'),
			close
		}
	};

	worker.postMessage({ type: 'orange-db-client-ready' });
	return client;

	function __createSyncClient() {
		return client.syncClient;
	}

	function hostLocal(options = {}) {
		const tableName = options.syncTableName;
		return {
			get: requestInTransaction.bind(null, options.transaction, 'get', { tableName }),
			post: requestInTransaction.bind(null, options.transaction, 'post', { tableName }),
			patch: requestInTransaction.bind(null, options.transaction, 'patch', { tableName }),
			syncCommand: requestInTransaction.bind(null, options.transaction, 'syncCommand', {}),
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
		transaction.setSyncContext = async function(context) {
			await request('transaction.syncContext', { transactionId }, serializeSyncPayload(context));
		};
		transaction.flushSyncContext = async function(context) {
			return request('transaction.flushSyncContext', { transactionId }, serializeSyncPayload(context));
		};
		return transaction;
	}

	function syncRequest(method, options) {
		return request(`sync.${method}`, {}, options);
	}

	function request(method, meta, ...args) {
		if (closed)
			return Promise.reject(new Error('DB worker client closed.'));
		if (terminalError)
			return Promise.reject(terminalError);
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
		if (typeof event !== 'string' || typeof listener !== 'function')
			return () => {};
		let eventListeners = listeners.get(event);
		if (!eventListeners) {
			eventListeners = new Set();
			listeners.set(event, eventListeners);
		}
		eventListeners.add(listener);
		if (!isAlwaysForwardedEvent(event))
			request('sync.on', {}, event).catch(() => {});
		if (event === 'initial-ready' && hasInitialReady) {
			const readyPayload = lastInitialReady;
			Promise.resolve().then(() => {
				if (eventListeners.has(listener) && hasInitialReady && lastInitialReady === readyPayload)
					callListener(listener, readyPayload);
			});
		}
		return () => off(event, listener);
	}

	function off(event, listener) {
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		eventListeners.delete(listener);
		if (eventListeners.size === 0) {
			listeners.delete(event);
			if (!isAlwaysForwardedEvent(event))
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

	function close() {
		if (closed)
			return;
		closed = true;
		worker.removeEventListener('message', onMessage);
		worker.removeEventListener('error', onWorkerError);
		worker.removeEventListener('messageerror', onWorkerError);
		for (const entry of pending.values())
			entry.reject(new Error('DB worker client closed.'));
		pending.clear();
		listeners.clear();
		hasInitialReady = false;
		lastInitialReady = undefined;
		if (typeof worker.terminate === 'function') {
			try {
				worker.terminate();
			}
			catch (_e) {
				// Closing is best-effort for Worker-backed clients.
			}
		}
		else if (typeof worker.close === 'function') {
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
		if (message.type === 'orange-db-interceptor-request') {
			void handleInterceptorRequest(message);
			return;
		}
		if (message.type === 'orange-db-event') {
			const payload = deserializeEventPayload(message.payload);
			if (message.event === 'initial-ready') {
				hasInitialReady = true;
				lastInitialReady = payload;
			}
			emit(message.event, payload);
			return;
		}
		if (message.type !== 'orange-db-response')
			return;
		const entry = pending.get(message.id);
		if (!entry)
			return;
		pending.delete(message.id);
		if (message.error)
			entry.reject(deserializeError(message.error, 'DB worker request failed.'));
		else
			entry.resolve(message.result);
	}

	function emit(event, payload) {
		if (event === 'operation') {
			payload = withSyncOperationMemory(payload);
			try {
				emitToListeners('operation', payload);
				if (payload && typeof payload.operation === 'string')
					emitToListeners(`operation:${payload.operation}`, payload);
			}
			finally {
				finalizeSyncOperationMemory(payload);
			}
			return;
		}
		if (event && event.startsWith && event.startsWith('operation:')) {
			payload = withSyncOperationMemory(payload);
			try {
				emitToListeners(event, payload);
			}
			finally {
				finalizeSyncOperationMemory(payload);
			}
			return;
		}
		emitToListeners(event, payload);
	}

	function emitToListeners(event, payload) {
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		for (const listener of Array.from(eventListeners))
			callListener(listener, payload);
	}

	function callListener(listener, payload) {
		try {
			listener(payload);
		}
		catch (_error) {
			// Notifications must never interrupt worker message handling or other listeners.
		}
	}

	async function handleInterceptorRequest(message) {
		try {
			const result = await applyInterceptor(message);
			postInterceptorResponse(message.id, result);
		}
		catch (error) {
			postInterceptorResponse(message.id, undefined, error);
		}
	}

	function applyInterceptor(message) {
		if (message.phase === 'request')
			return interceptors.applyRequest(message.payload);
		if (message.phase === 'response')
			return interceptors.applyResponse(message.payload);
		if (message.phase === 'response-error')
			return interceptors.applyResponseError(deserializeError(message.error, 'DB worker HTTP request failed.'));
		throw new Error(`Unknown DB worker interceptor phase "${message.phase}".`);
	}

	function postInterceptorResponse(id, result, error) {
		if (closed || terminalError)
			return;
		try {
			worker.postMessage({
				type: 'orange-db-interceptor-response',
				id,
				result,
				error: error ? serializeError(error) : undefined
			});
		}
		catch (postError) {
			if (!error) {
				try {
					worker.postMessage({
						type: 'orange-db-interceptor-response',
						id,
						error: serializeError(postError)
					});
				}
				catch (_ignored) {
					// The worker cannot be notified when even the serialized error cannot be posted.
				}
			}
		}
	}

	function onWorkerError(event) {
		if (closed || terminalError)
			return;
		terminalError = toWorkerError(event);
		for (const entry of pending.values())
			entry.reject(terminalError);
		pending.clear();
		emit('error', { method: 'worker', error: terminalError });
	}
}

function getTransactionId(transaction) {
	return transaction && transaction.__orangeDbWorkerTransactionId;
}

function toWorkerError(event) {
	if (event && event.error instanceof Error)
		return event.error;
	return new Error(event && event.message
		? event.message
		: 'DB worker failed before completing the request.');
}

module.exports = createDbWorkerClient;
