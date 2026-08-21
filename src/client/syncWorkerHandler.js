const { syncAutoStartSymbol } = require('./syncAuto');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');
const {
	createSyncAbortController,
	syncAbortError,
	syncAbortSignalSymbol
} = require('./syncAbort');
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
	const requestControllers = new Map();
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
		if (message.type === 'orange-sync-worker-cancel') {
			cancelRequest(message.id);
			return;
		}
		if (message.type !== 'orange-sync-worker-request')
			return;
		if (message.method === 'sync')
			restartPendingRequestInterceptors();
		const controller = createSyncAbortController();
		requestControllers.set(message.id, controller);
		try {
			const result = await dispatch(message.method, message.args || [], controller.signal);
			postResponse(message.id, result);
		}
		catch (e) {
			postResponse(message.id, undefined, e);
		}
		finally {
			requestControllers.delete(message.id);
		}
	}

	function dispatch(method, args, signal) {
		if (method === 'on')
			return subscribeSyncEvent(args[0]);
		if (method === 'off')
			return unsubscribeSyncEvent(args[0]);
		if (method === 'ensureLocalSchemaReady') {
			const ensureReady = syncClient[ensureLocalSchemaReadySymbol];
			if (typeof ensureReady !== 'function')
				return { skipped: true };
			return ensureReady.apply(syncClient, withAbortOptions(args, signal));
		}
		const fn = syncClient[method];
		if (typeof fn !== 'function')
			throw new Error(`Sync worker method "${method}" is not implemented.`);
		return fn.apply(syncClient, methodAcceptsOptions(method) ? withAbortOptions(args, signal) : args);
	}

	function cancelRequest(id) {
		const controller = requestControllers.get(id);
		if (controller)
			controller.abort(syncAbortError(undefined, 'Sync worker request cancelled.'));
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
		for (const controller of requestControllers.values())
			controller.abort(syncAbortError(undefined, 'Sync worker handler stopped.'));
		requestControllers.clear();
		if (options.stopSyncClient !== false && typeof syncClient.stop === 'function')
			await syncClient.stop();
		for (const eject of interceptorEjectors)
			eject();
		interceptorEjectors.length = 0;
		for (const entry of new Set(pendingInterceptorRequests.values()))
			settleInterceptorRequest(entry, entry.reject, new Error('Sync worker interceptor bridge stopped.'));
		pendingInterceptorRequests.clear();
		for (const unsubscribe of syncEventUnsubscribers.values())
			unsubscribe();
		syncEventUnsubscribers.clear();
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
		install(interceptors.request, (config, context) => callClientInterceptor('request', config, undefined, context));
		install(
			interceptors.response,
			(response, context) => callClientInterceptor('response', response, undefined, context),
			(error, context) => callClientInterceptor('response-error', undefined, error, context)
		);

		function install(manager, onFulfilled, onRejected) {
			if (!manager || typeof manager.use !== 'function')
				return;
			const id = manager.use(onFulfilled, onRejected);
			if (typeof manager.eject === 'function')
				interceptorEjectors.push(() => manager.eject(id));
		}
	}

	function callClientInterceptor(phase, payload, error, context) {
		return new Promise((resolve, reject) => {
			const signal = context && context.signal;
			const entry = {
				id: undefined,
				phase,
				payload,
				error,
				resolve,
				reject,
				removeAbort: undefined,
				settled: false
			};
			if (signal) {
				const abort = () => {
					settleInterceptorRequest(entry, reject, syncAbortError(signal.reason));
				};
				if (signal.aborted) {
					abort();
					return;
				}
				signal.addEventListener('abort', abort, { once: true });
				entry.removeAbort = () => signal.removeEventListener('abort', abort);
			}
			postInterceptorRequest(entry);
		});
	}

	function restartPendingRequestInterceptors() {
		const entries = Array.from(new Set(pendingInterceptorRequests.values()));
		for (const entry of entries) {
			if (!entry.settled && entry.phase === 'request')
				postInterceptorRequest(entry);
		}
	}

	function postInterceptorRequest(entry) {
		if (entry.settled)
			return;
		if (entry.id !== undefined)
			pendingInterceptorRequests.delete(entry.id);
		entry.id = nextInterceptorRequestId++;
		pendingInterceptorRequests.set(entry.id, entry);
		try {
			postMessage({
				type: 'orange-sync-worker-interceptor-request',
				id: entry.id,
				phase: entry.phase,
				payload: entry.payload,
				error: entry.error ? serializeError(entry.error) : undefined
			});
		}
		catch (postError) {
			settleInterceptorRequest(entry, entry.reject, postError);
		}
	}

	function handleInterceptorResponse(message) {
		const entry = pendingInterceptorRequests.get(message.id);
		if (!entry)
			return;
		if (message.error)
			settleInterceptorRequest(
				entry,
				entry.reject,
				deserializeError(message.error, 'Sync worker interceptor failed.')
			);
		else
			settleInterceptorRequest(entry, entry.resolve, message.result);
	}

	function settleInterceptorRequest(entry, callback, value) {
		if (entry.settled)
			return;
		entry.settled = true;
		if (entry.id !== undefined)
			pendingInterceptorRequests.delete(entry.id);
		if (entry.removeAbort)
			entry.removeAbort();
		callback(value);
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

function methodAcceptsOptions(method) {
	return method === 'sync'
		|| method === 'ensureLocalSchema'
		|| method === 'resetLocal'
		|| method === 'start';
}

function withAbortOptions(args, signal) {
	const result = Array.isArray(args) ? args.slice() : [];
	const input = result[0] && result[0] === Object(result[0]) ? result[0] : {};
	const options = { ...input };
	Object.defineProperty(options, syncAbortSignalSymbol, {
		value: signal,
		configurable: true
	});
	result[0] = options;
	return result;
}

function getPostTarget() {
	if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
		return self;
	if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
		return globalThis;
}

module.exports = createSyncWorkerHandler;
