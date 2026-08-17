const {
	finalizeSyncOperationMemory,
	withSyncOperationMemory
} = require('../sync/operationContext');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');

function createSyncWorkerClient(worker, options = {}) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('Sync worker client requires a Worker-like object.');

	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();
	const lastEvents = new Map();

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
		interceptors: createNoopInterceptors(),
		[ensureLocalSchemaReadySymbol]: request.bind(null, 'ensureLocalSchemaReady')
	};

	return client;

	function request(method, ...args) {
		const id = nextId++;
		return new Promise((resolve, reject) => {
			const timeoutMs = resolveRequestTimeoutMs(method, args, options);
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
		request('on', event).catch(() => {});
		const lastEvent = lastEvents.get(event);
		if (lastEvent !== undefined) {
			Promise.resolve().then(() => {
				if (eventListeners.has(listener) && lastEvents.get(event) === lastEvent)
					listener(lastEvent);
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
		worker.removeEventListener('message', onMessage);
		worker.removeEventListener('error', onWorkerError);
		worker.removeEventListener('messageerror', onWorkerError);
		for (const entry of pending.values()) {
			if (entry.timeoutId)
				clearTimeout(entry.timeoutId);
			entry.reject(new Error('Sync worker client closed.'));
		}
		pending.clear();
		listeners.clear();
		lastEvents.clear();
		if (typeof worker.terminate === 'function')
			worker.terminate();
		else if (typeof worker.close === 'function')
			worker.close();
	}

	function onMessage(event) {
		const message = event && event.data;
		if (!message || message.type === undefined)
			return;
		if (message.type === 'orange-sync-worker-event') {
			lastEvents.set(message.event, message.payload);
			emit(message.event, message.payload);
			return;
		}
		if (message.type !== 'orange-sync-worker-response')
			return;
		const entry = pending.get(message.id);
		if (!entry)
			return;
		clearPendingRequest(message.id);
		if (message.error)
			entry.reject(toError(message.error));
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
		const error = toWorkerError(event);
		for (const entry of pending.values()) {
			if (entry.timeoutId)
				clearTimeout(entry.timeoutId);
			entry.reject(error);
		}
		pending.clear();
		emit('error', { method: 'worker', error });
	}

	function emit(event, payload) {
		if (event === 'operation' || event && event.startsWith && event.startsWith('operation:')) {
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

function resolveRequestTimeoutMs(method, args, options) {
	const methodOptions = args && args[0];
	const configured = methodOptions && methodOptions === Object(methodOptions)
		? normalizePositiveInteger(methodOptions.timeoutMs)
		: undefined;
	if (configured)
		return configured + 1000;
	const fallback = normalizePositiveInteger(options.requestTimeoutMs);
	if (fallback)
		return fallback;
	if (method === 'on' || method === 'off' || method === 'isRunning' || method === 'stop')
		return 10000;
	return 300000;
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

function createNoopInterceptors() {
	return {
		request: createNoopInterceptorManager(),
		response: createNoopInterceptorManager()
	};
}

function createNoopInterceptorManager() {
	let nextId = 1;
	return {
		use() {
			return `sync-worker-noop-${nextId++}`;
		},
		eject() {}
	};
}

function toError(error) {
	const e = new Error(error && error.message ? error.message : 'Sync worker request failed.');
	if (error && error.name)
		e.name = error.name;
	if (error && error.stack)
		e.stack = error.stack;
	return e;
}

module.exports = createSyncWorkerClient;
