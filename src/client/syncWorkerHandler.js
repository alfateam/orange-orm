const { syncAutoStartSymbol } = require('./syncAuto');
const { ensureLocalSchemaReadySymbol } = require('./syncClient');

function createSyncWorkerHandler(syncClient, options = {}) {
	if (!syncClient)
		throw new Error('Sync worker handler requires a sync client.');

	const syncEventUnsubscribers = new Map();
	const postMessage = options.postMessage || ((message) => {
		const target = getPostTarget();
		if (target)
			target.postMessage(message);
	});
	const forwardedEvents = Array.isArray(options.forwardEvents)
		? options.forwardEvents
		: ['sync', 'error', 'initial-ready', 'sync-progress'];
	for (let i = 0; i < forwardedEvents.length; i++)
		subscribeSyncEvent(forwardedEvents[i]);

	if (options.autoStart !== false) {
		const startAuto = typeof syncClient[syncAutoStartSymbol] === 'function'
			? syncClient[syncAutoStartSymbol]
			: syncClient.start;
		if (typeof startAuto === 'function') {
			void Promise.resolve(startAuto.call(syncClient)).catch((error) => {
				postMessage({
					type: 'orange-sync-worker-event',
					event: 'error',
					payload: { method: 'auto-start', error: serializeError(error) }
				});
			});
		}
	}

	return {
		handleMessage,
		stop
	};

	async function handleMessage(event) {
		const message = event && event.data;
		if (!message || message.type !== 'orange-sync-worker-request')
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
			postMessage({
				type: 'orange-sync-worker-event',
				event,
				payload
			});
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
		for (const unsubscribe of syncEventUnsubscribers.values())
			unsubscribe();
		syncEventUnsubscribers.clear();
		if (options.stopSyncClient !== false && typeof syncClient.stop === 'function')
			await syncClient.stop();
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

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

function getPostTarget() {
	if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
		return self;
	if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
		return globalThis;
}

module.exports = createSyncWorkerHandler;
