function createSyncWorkerClient(worker) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('Sync worker client requires a Worker-like object.');

	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	worker.addEventListener('message', onMessage);

	return {
		pull: request.bind(null, 'pull'),
		push: request.bind(null, 'push'),
		on,
		off,
		close
	};

	function request(method, options) {
		const id = nextId++;
		worker.postMessage({
			type: 'orange-sync-request',
			id,
			method,
			options
		});
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
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
		return () => off(event, listener);
	}

	function off(event, listener) {
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		eventListeners.delete(listener);
		if (eventListeners.size === 0)
			listeners.delete(event);
	}

	function close() {
		worker.removeEventListener('message', onMessage);
		for (const entry of pending.values()) {
			entry.reject(new Error('Sync worker client closed.'));
		}
		pending.clear();
		listeners.clear();
	}

	function onMessage(event) {
		const message = event && event.data;
		if (!message || message.type === undefined)
			return;
		if (message.type === 'orange-sync-event') {
			emit(message.event, message.payload);
			return;
		}
		if (message.type !== 'orange-sync-response')
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
		const eventListeners = listeners.get(event);
		if (!eventListeners)
			return;
		for (const listener of Array.from(eventListeners)) {
			listener(payload);
		}
	}
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
