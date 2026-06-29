const createDbWorkerHandler = require('./dbWorkerHandler');

function createSharedDbWorkerHandler(createClient, options = {}) {
	if (typeof createClient !== 'function')
		throw new Error('Shared DB worker handler requires a client factory.');

	const ports = new Map();
	let client;
	let clientPromise;
	let stoppingClientPromise;
	let stopped = false;
	let removeConnectListener;

	if (options.autoConnect !== false)
		removeConnectListener = attachConnectListener(options.target, handleConnect);

	return {
		handleConnect,
		connect: handleConnect,
		stop
	};

	function handleConnect(event) {
		if (stopped)
			throw new Error('Shared DB worker handler is stopped.');
		const port = resolvePort(event);
		if (!port)
			throw new Error('Shared DB worker handler requires a MessagePort.');

		const state = {
			port,
			handler: null,
			backlog: [],
			closed: false,
			error: null,
			listener: null
		};
		state.listener = onMessage.bind(null, state);
		ports.set(port, state);
		port.addEventListener('message', state.listener);
		if (typeof port.start === 'function')
			port.start();

		ensureClient()
			.then((resolvedClient) => {
				if (state.closed)
					return;
				state.handler = createDbWorkerHandler(resolvedClient, {
					autoStart: false,
					stopSyncClient: false,
					postMessage: (message) => safePostMessage(port, message)
				});
				drainBacklog(state);
			})
			.catch((error) => {
				state.error = error;
				failBacklog(state, error);
			});
	}

	function onMessage(state, event) {
		const message = event && event.data;
		if (message && message.type === 'orange-shared-db-port-close') {
			closePort(state);
			return;
		}
		if (state.closed)
			return;
		if (state.error) {
			postRequestError(state.port, message, state.error);
			return;
		}
		if (!state.handler) {
			state.backlog.push(event);
			return;
		}
		void state.handler.handleMessage(event);
	}

	function drainBacklog(state) {
		const backlog = state.backlog.splice(0);
		for (let i = 0; i < backlog.length; i++)
			onMessage(state, backlog[i]);
	}

	function failBacklog(state, error) {
		const backlog = state.backlog.splice(0);
		for (let i = 0; i < backlog.length; i++) {
			const message = backlog[i] && backlog[i].data;
			postRequestError(state.port, message, error);
		}
	}

	function ensureClient() {
		if (clientPromise)
			return clientPromise;
		clientPromise = Promise.resolve()
			.then(createClient)
			.then((resolvedClient) => {
				client = resolvedClient;
				if (options.autoStart !== false && client && client.syncClient && typeof client.syncClient.start === 'function')
					void client.syncClient.start();
				return client;
			});
		return clientPromise;
	}

	function closePort(state, closeMessagePort = true) {
		if (!state || state.closed)
			return;
		state.closed = true;
		if (state.port && state.listener && typeof state.port.removeEventListener === 'function')
			state.port.removeEventListener('message', state.listener);
		if (state.handler)
			state.handler.stop();
		ports.delete(state.port);
		if (closeMessagePort && state.port && typeof state.port.close === 'function')
			state.port.close();
		if (ports.size === 0 && options.closeOnLastPort !== false)
			void stopClient();
	}

	async function stop() {
		stopped = true;
		if (removeConnectListener) {
			removeConnectListener();
			removeConnectListener = undefined;
		}
		for (const state of Array.from(ports.values()))
			closePort(state, true);
		await stopClient();
	}

	async function stopClient() {
		if (stoppingClientPromise)
			return stoppingClientPromise;
		stoppingClientPromise = Promise.resolve()
			.then(async () => {
				const resolvedClient = client || await clientPromise.catch(() => null);
				if (resolvedClient && resolvedClient.syncClient && typeof resolvedClient.syncClient.stop === 'function')
					resolvedClient.syncClient.stop();
				if (resolvedClient && typeof resolvedClient.close === 'function')
					await resolvedClient.close();
				else if (resolvedClient && typeof resolvedClient.end === 'function')
					await resolvedClient.end();
				client = undefined;
				clientPromise = undefined;
			})
			.finally(() => {
				stoppingClientPromise = undefined;
			});
		return stoppingClientPromise;
	}
}

function attachConnectListener(target, handleConnect) {
	const connectTarget = target || (typeof globalThis !== 'undefined' ? globalThis : undefined);
	if (!connectTarget || typeof connectTarget.addEventListener !== 'function')
		return undefined;
	const listener = (event) => handleConnect(event);
	connectTarget.addEventListener('connect', listener);
	return () => connectTarget.removeEventListener('connect', listener);
}

function resolvePort(event) {
	if (!event)
		return null;
	if (event.ports && event.ports[0])
		return event.ports[0];
	if (event.port)
		return event.port;
	if (typeof event.postMessage === 'function')
		return event;
	return null;
}

function postRequestError(port, message, error) {
	if (!message || message.type !== 'orange-db-request')
		return;
	safePostMessage(port, {
		type: 'orange-db-response',
		id: message.id,
		error: serializeError(error)
	});
}

function safePostMessage(port, message) {
	try {
		port.postMessage(message);
	}
	catch (_e) {
		// The tab may have closed while a request was resolving.
	}
}

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

module.exports = createSharedDbWorkerHandler;
