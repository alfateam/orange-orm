const { createSyncAuto } = require('./syncAuto');

function createSyncWorkerHandler(syncClient, options = {}) {
	if (!syncClient)
		throw new Error('Sync worker handler requires a sync client.');

	let running = false;
	let currentDrainPromise = Promise.resolve();
	const pending = {
		push: [],
		pull: []
	};
	let auto;
	const postMessage = options.postMessage || ((message) => {
		const target = getPostTarget();
		if (target)
			target.postMessage(message);
	});

	if (options.autoStart !== false)
		startAuto();

	return {
		handleMessage,
		pull: requestPull,
		push: requestPush,
		stop
	};

	async function handleMessage(event) {
		const message = event && event.data;
		if (!message || message.type !== 'orange-sync-request')
			return;
		try {
			let result;
			if (message.method === 'pull')
				result = await requestPull(message.options);
			else if (message.method === 'push')
				result = await requestPush(message.options);
			else
				throw new Error(`Unknown sync worker method "${message.method}".`);
			postResponse(message.id, result);
		}
		catch (e) {
			postResponse(message.id, undefined, e);
		}
	}

	function requestPush(options) {
		return requestSync('push', options);
	}

	function requestPull(options) {
		return requestSync('pull', options);
	}

	function stop() {
		if (auto)
			auto.stop();
		else if (syncClient && typeof syncClient.stop === 'function')
			syncClient.stop();
	}

	function requestSync(method, options) {
		return new Promise((resolve, reject) => {
			pending[method].push({ options, resolve, reject });
			drainSyncQueue();
		});
	}

	function drainSyncQueue() {
		if (running)
			return currentDrainPromise;
		running = true;
		currentDrainPromise = run()
			.finally(() => {
				running = false;
				if (hasPending())
					drainSyncQueue();
			});
		return currentDrainPromise;
	}

	async function run() {
		while (hasPending()) {
			const method = pending.push.length > 0 ? 'push' : 'pull';
			const batch = pending[method].splice(0);
			const options = batch[batch.length - 1].options;
			try {
				const result = await callSyncMethod(method, options);
				resolveBatch(batch, result);
			}
			catch (e) {
				rejectBatch(batch, e);
			}
		}
	}

	function callSyncMethod(method, options) {
		const fn = syncClient && syncClient[method];
		if (typeof fn !== 'function') {
			return {
				method,
				skipped: true,
				reason: `${method}_not_implemented`
			};
		}
		return fn.call(syncClient, options);
	}

	function hasPending() {
		return pending.push.length > 0 || pending.pull.length > 0;
	}

	function resolveBatch(batch, result) {
		for (let i = 0; i < batch.length; i++)
			batch[i].resolve(result);
	}

	function rejectBatch(batch, error) {
		for (let i = 0; i < batch.length; i++)
			batch[i].reject(error);
	}

	function startAuto() {
		if (typeof syncClient.getConfig === 'function') {
			auto = createSyncAuto({
				push: requestPush,
				pull: requestPull
			}, () => syncClient.getConfig());
			void auto.start();
			return;
		}
		if (typeof syncClient.start === 'function')
			void syncClient.start();
	}

	function postResponse(id, result, error) {
		postMessage({
			type: 'orange-sync-response',
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
