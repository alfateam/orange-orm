const { syncAutoStartSymbol } = require('./syncAuto');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');
const {
	alwaysForwardedEvents,
	deserializeError,
	serializeError,
	serializeEventPayload
} = require('./syncWorkerProtocol');

function createSyncWorkerHandler(syncClient, options = {}) {
	if (!syncClient)
		throw new Error('Sync worker handler requires a sync client.');

	const syncEventUnsubscribers = new Map();
	const interceptorEjectors = [];
	const pendingInterceptorRequests = new Map();
	let nextInterceptorRequestId = 1;
	let autoStarted = false;
	let clientReady = false;
	let stopped = false;
	let hasPendingInitialReady = false;
	let pendingInitialReady;
	const postMessage = options.postMessage || ((message) => {
		const target = getPostTarget();
		if (target)
			target.postMessage(message);
	});
	const forwardedEvents = Array.from(new Set([
		...alwaysForwardedEvents,
		...(Array.isArray(options.forwardEvents) ? options.forwardEvents : [])
	]));
	installInterceptorBridge();
	for (let i = 0; i < forwardedEvents.length; i++)
		subscribeSyncEvent(forwardedEvents[i]);

	return {
		handleMessage,
		stop
	};

	async function handleMessage(event) {
		const message = event && event.data;
		if (!message)
			return;
		if (message.type === 'orange-sync-worker-ready') {
			handleClientReady();
			return;
		}
		if (message.type === 'orange-sync-worker-interceptor-response') {
			handleInterceptorResponse(message);
			return;
		}
		if (message.type !== 'orange-sync-worker-request')
			return;
		try {
			const result = await dispatch(message.method, message.args || []);
			postResponse(message.id, result);
		}
		catch (e) {
			postResponse(message.id, undefined, e);
		}
	}

	function dispatch(method, args) {
		if (method === 'on')
			return subscribeSyncEvent(args[0]);
		if (method === 'off')
			return unsubscribeSyncEvent(args[0]);
		if (method === 'ensureLocalSchemaReady') {
			const ensureReady = syncClient[ensureLocalSchemaReadySymbol];
			if (typeof ensureReady !== 'function')
				return { skipped: true };
			return ensureReady.apply(syncClient, args);
		}
		const fn = syncClient[method];
		if (typeof fn !== 'function')
			throw new Error(`Sync worker method "${method}" is not implemented.`);
		return fn.apply(syncClient, args);
	}

	function subscribeSyncEvent(event) {
		if (typeof event !== 'string' || syncEventUnsubscribers.has(event))
			return;
		if (typeof syncClient.on !== 'function')
			return;
		const unsubscribe = syncClient.on(event, (payload) => {
			if (event === 'initial-ready' && !clientReady) {
				hasPendingInitialReady = true;
				pendingInitialReady = payload;
				return;
			}
			postEvent(event, payload);
		});
		syncEventUnsubscribers.set(event, unsubscribe);
	}

	function unsubscribeSyncEvent(event) {
		const unsubscribe = syncEventUnsubscribers.get(event);
		if (!unsubscribe)
			return;
		unsubscribe();
		syncEventUnsubscribers.delete(event);
	}

	async function stop() {
		stopped = true;
		for (const eject of interceptorEjectors)
			eject();
		interceptorEjectors.length = 0;
		for (const entry of pendingInterceptorRequests.values())
			entry.reject(new Error('Sync worker interceptor bridge stopped.'));
		pendingInterceptorRequests.clear();
		for (const unsubscribe of syncEventUnsubscribers.values())
			unsubscribe();
		syncEventUnsubscribers.clear();
		if (options.stopSyncClient !== false && typeof syncClient.stop === 'function')
			await syncClient.stop();
	}

	function handleClientReady() {
		if (clientReady || stopped)
			return;
		clientReady = true;
		if (hasPendingInitialReady) {
			postEvent('initial-ready', pendingInitialReady);
			hasPendingInitialReady = false;
			pendingInitialReady = undefined;
		}
		startAutomaticSync();
	}

	function startAutomaticSync() {
		if (autoStarted || stopped || options.autoStart === false)
			return;
		autoStarted = true;
		const startAuto = typeof syncClient[syncAutoStartSymbol] === 'function'
			? syncClient[syncAutoStartSymbol]
			: syncClient.start;
		if (typeof startAuto !== 'function')
			return;
		void Promise.resolve(startAuto.call(syncClient)).catch((error) => {
			postEvent('error', { method: 'auto-start', error });
		});
	}

	function postEvent(event, payload) {
		postMessage({
			type: 'orange-sync-worker-event',
			event,
			payload: serializeEventPayload(payload)
		});
	}

	function installInterceptorBridge() {
		const interceptors = syncClient.interceptors;
		if (!interceptors)
			return;
		install(interceptors.request, (config) => callClientInterceptor('request', config));
		install(
			interceptors.response,
			(response) => callClientInterceptor('response', response),
			(error) => callClientInterceptor('response-error', undefined, error)
		);

		function install(manager, onFulfilled, onRejected) {
			if (!manager || typeof manager.use !== 'function')
				return;
			const id = manager.use(onFulfilled, onRejected);
			if (typeof manager.eject === 'function')
				interceptorEjectors.push(() => manager.eject(id));
		}
	}

	function callClientInterceptor(phase, payload, error) {
		const id = nextInterceptorRequestId++;
		return new Promise((resolve, reject) => {
			pendingInterceptorRequests.set(id, { resolve, reject });
			try {
				postMessage({
					type: 'orange-sync-worker-interceptor-request',
					id,
					phase,
					payload,
					error: error ? serializeError(error) : undefined
				});
			}
			catch (postError) {
				pendingInterceptorRequests.delete(id);
				reject(postError);
			}
		});
	}

	function handleInterceptorResponse(message) {
		const entry = pendingInterceptorRequests.get(message.id);
		if (!entry)
			return;
		pendingInterceptorRequests.delete(message.id);
		if (message.error)
			entry.reject(deserializeError(message.error, 'Sync worker interceptor failed.'));
		else
			entry.resolve(message.result);
	}

	function postResponse(id, result, error) {
		postMessage({
			type: 'orange-sync-worker-response',
			id,
			result,
			error: error ? serializeError(error) : undefined
		});
	}
}

function getPostTarget() {
	if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
		return self;
	if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
		return globalThis;
}

module.exports = createSyncWorkerHandler;
