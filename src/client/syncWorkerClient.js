const {
	finalizeSyncOperationMemory,
	withSyncOperationMemory
} = require('../sync/operationContext');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');

function createSyncWorkerClient(worker) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('Sync worker client requires a Worker-like object.');

	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	worker.addEventListener('message', onMessage);
	if (typeof worker.start === 'function')
		worker.start();

	const client = {
		sync: request.bind(null, 'sync'),
		ensureLocalSchema: request.bind(null, 'ensureLocalSchema'),
		resetLocal: request.bind(null, 'resetLocal'),
		discardLocalChanges: request.bind(null, 'discardLocalChanges'),
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
			pending.set(id, { resolve, reject });
			worker.postMessage({
				type: 'orange-sync-worker-request',
				id,
				method,
				args
			});
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
		request('on', event).catch(() => {});
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
		for (const entry of pending.values())
			entry.reject(new Error('Sync worker client closed.'));
		pending.clear();
		listeners.clear();
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
			emit(message.event, message.payload);
			return;
		}
		if (message.type !== 'orange-sync-worker-response')
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
