const createDbWorkerClient = require('./dbWorkerClient');

function createSharedDbWorkerClient(sharedWorkerOrUrl, options = {}) {
	const sharedWorker = resolveSharedWorker(sharedWorkerOrUrl, options);
	const port = sharedWorker && sharedWorker.port || sharedWorker;
	if (!port || typeof port.postMessage !== 'function')
		throw new Error('Shared DB worker client requires a SharedWorker, MessagePort, or worker URL.');
	if (typeof port.start === 'function')
		port.start();
	return createDbWorkerClient(toWorkerLike(port));
}

function resolveSharedWorker(sharedWorkerOrUrl, options) {
	if (isWorkerUrl(sharedWorkerOrUrl)) {
		if (typeof SharedWorker === 'undefined')
			throw new Error('Shared DB worker requires SharedWorker support or an existing SharedWorker-like object.');
		return new SharedWorker(sharedWorkerOrUrl, getSharedWorkerOptions(options));
	}
	return sharedWorkerOrUrl;
}

function isWorkerUrl(value) {
	return typeof value === 'string'
		|| typeof URL !== 'undefined' && value instanceof URL;
}

function getSharedWorkerOptions(options = {}) {
	if (options.workerOptions)
		return options.workerOptions;
	const workerOptions = {
		type: options.type || 'module'
	};
	if (options.name)
		workerOptions.name = options.name;
	if (options.credentials)
		workerOptions.credentials = options.credentials;
	return workerOptions;
}

function toWorkerLike(port) {
	let closed = false;
	return {
		postMessage(message) {
			port.postMessage(message);
		},
		addEventListener(type, listener) {
			port.addEventListener(type, listener);
		},
		removeEventListener(type, listener) {
			port.removeEventListener(type, listener);
		},
		close() {
			if (closed)
				return;
			closed = true;
			try {
				port.postMessage({ type: 'orange-shared-db-port-close' });
			}
			catch (_e) {
				// The port may already be gone.
			}
			if (typeof port.close === 'function')
				port.close();
		}
	};
}

module.exports = createSharedDbWorkerClient;
