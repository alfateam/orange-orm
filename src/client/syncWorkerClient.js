const {
	finalizeSyncOperationMemory,
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

function createSyncWorkerClient(worker, options = {}) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('Sync worker client requires a Worker-like object.');

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
		sync: request.bind(null, 'sync'),
		ensureLocalSchema: request.bind(null, 'ensureLocalSchema'),
		resetLocal: request.bind(null, 'resetLocal'),
		start: request.bind(null, 'start'),
		stop: request.bind(null, 'stop'),
		isRunning: request.bind(null, 'isRunning'),
		waitForInitialSync: request.bind(null, 'waitForInitialSync'),
		on,
		off,
		once,
		close,
		interceptors,
		[ensureLocalSchemaReadySymbol]: request.bind(null, 'ensureLocalSchemaReady')
	};

	worker.postMessage({ type: 'orange-sync-worker-ready' });
	return client;

	function request(method, ...args) {
		if (closed)
			return Promise.reject(new Error('Sync worker client closed.'));
		if (terminalError)
			return Promise.reject(terminalError);
		const id = nextId++;
		return new Promise((resolve, reject) => {
			const timeoutMs = resolveRequestTimeoutMs(method, options);
			const timeoutId = timeoutMs
				? setTimeout(() => rejectTimedOutRequest(id, method, timeoutMs), timeoutMs)
				: undefined;
			pending.set(id, { resolve, reject, timeoutId });
			try {
				worker.postMessage({
					type: 'orange-sync-worker-request',
					id,
					method,
					args
				});
			}
			catch (e) {
				clearPendingRequest(id);
				reject(e);
			}
		});
	}

	function rejectTimedOutRequest(id, method, timeoutMs) {
		const entry = pending.get(id);
		if (!entry)
			return;
		pending.delete(id);
		postCancel(id);
		entry.reject(new Error(`Sync worker request "${method}" timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
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
			request('on', event).catch(() => {});
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
				request('off', event).catch(() => {});
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
		const closeError = new Error('Sync worker client closed.');
		worker.removeEventListener('message', onMessage);
		worker.removeEventListener('error', onWorkerError);
		worker.removeEventListener('messageerror', onWorkerError);
		for (const [id, entry] of pending) {
			postCancel(id);
			if (entry.timeoutId)
				clearTimeout(entry.timeoutId);
			entry.reject(closeError);
		}
		pending.clear();
		listeners.clear();
		hasInitialReady = false;
		lastInitialReady = undefined;
		if (typeof worker.terminate === 'function')
			worker.terminate();
		else if (typeof worker.close === 'function')
			worker.close();
	}

	function onMessage(event) {
		const message = event && event.data;
		if (!message || message.type === undefined)
			return;
		if (message.type === 'orange-sync-worker-interceptor-request') {
			void handleInterceptorRequest(message);
			return;
		}
		if (message.type === 'orange-sync-worker-event') {
			const payload = deserializeEventPayload(message.payload);
			if (message.event === 'initial-ready') {
				hasInitialReady = true;
				lastInitialReady = payload;
			}
			emit(message.event, payload);
			return;
		}
		if (message.type !== 'orange-sync-worker-response')
			return;
		const entry = pending.get(message.id);
		if (!entry)
			return;
		clearPendingRequest(message.id);
		if (message.error)
			entry.reject(deserializeError(message.error));
		else
			entry.resolve(message.result);
	}

	function clearPendingRequest(id) {
		const entry = pending.get(id);
		if (!entry)
			return;
		pending.delete(id);
		if (entry.timeoutId)
			clearTimeout(entry.timeoutId);
	}

	function onWorkerError(event) {
		if (terminalError)
			return;
		const error = toWorkerError(event);
		terminalError = error;
		for (const entry of pending.values()) {
			if (entry.timeoutId)
				clearTimeout(entry.timeoutId);
			entry.reject(error);
		}
		pending.clear();
		emit('error', { method: 'worker', error });
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
			return interceptors.applyResponseError(deserializeError(message.error, 'Sync worker HTTP request failed.'));
		throw new Error(`Unknown sync worker interceptor phase "${message.phase}".`);
	}

	function postInterceptorResponse(id, result, error) {
		if (closed || terminalError)
			return;
		try {
			worker.postMessage({
				type: 'orange-sync-worker-interceptor-response',
				id,
				result,
				error: error ? serializeError(error) : undefined
			});
		}
		catch (postError) {
			if (!error) {
				try {
					worker.postMessage({
						type: 'orange-sync-worker-interceptor-response',
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

	function postCancel(id) {
		if (terminalError)
			return;
		try {
			worker.postMessage({
				type: 'orange-sync-worker-cancel',
				id
			});
		}
		catch (_error) {
			// The original request is already being rejected locally.
		}
	}
}

function resolveRequestTimeoutMs(method, options) {
	const fallback = normalizePositiveInteger(options.requestTimeoutMs);
	if (fallback)
		return fallback;
	if (method === 'on' || method === 'off' || method === 'isRunning')
		return 10000;
	if (method === 'ensureLocalSchema' || method === 'ensureLocalSchemaReady' || method === 'resetLocal')
		return 300000;
	return undefined;
}

function normalizePositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toWorkerError(event) {
	if (event && event.error instanceof Error)
		return event.error;
	const message = event && event.message
		? event.message
		: 'Sync worker failed before completing the request.';
	return new Error(message);
}

module.exports = createSyncWorkerClient;
