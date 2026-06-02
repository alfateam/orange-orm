function createSyncWorkerHandler(syncClient, options = {}) {
	if (!syncClient)
		throw new Error('Sync worker handler requires a sync client.');

	let running = false;
	let currentDrainPromise = null;
	let scheduledAgain = false;
	let pushRequested = false;
	let pullRequested = false;
	let lastPushOptions;
	let lastPullOptions;
	const postMessage = options.postMessage || ((message) => {
		const target = getPostTarget();
		if (target)
			target.postMessage(message);
	});

	if (options.autoStart !== false && syncClient && typeof syncClient.start === 'function')
		void syncClient.start();

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
		pushRequested = true;
		lastPushOptions = options;
		return drainSyncQueue();
	}

	function requestPull(options) {
		pullRequested = true;
		lastPullOptions = options;
		return drainSyncQueue();
	}

	function stop() {
		if (syncClient && typeof syncClient.stop === 'function')
			syncClient.stop();
	}

	function drainSyncQueue() {
		if (running) {
			scheduledAgain = true;
			return currentDrainPromise;
		}

		running = true;
		currentDrainPromise = run()
			.finally(() => {
				running = false;
				currentDrainPromise = null;
			});
		return currentDrainPromise;
	}

	async function run() {
		let lastResult;
		while (pushRequested || pullRequested || scheduledAgain) {
			scheduledAgain = false;
			if (pushRequested) {
				pushRequested = false;
				lastResult = await callSyncMethod('push', lastPushOptions);
				if (syncClient.pull)
					pullRequested = true;
				continue;
			}

			if (pullRequested) {
				pullRequested = false;
				if (!pushRequested)
					lastResult = await callSyncMethod('pull', lastPullOptions);
			}
		}
		return lastResult;
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
