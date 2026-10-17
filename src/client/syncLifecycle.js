const {
	createSyncAbortController,
	isSyncAbortError,
	syncAbortError,
	syncAbortSignalSymbol,
	syncWorkTrackerSymbol,
	throwIfSyncAborted
} = require('./syncAbort');

// Own every operation, including work still unwinding after an abortable await.
// No account/auth state belongs here: each database has its own lifecycle.
function createSyncLifecycle() {
	const controllers = new Set();
	const pending = new Set();
	let paused = false;
	let closed = false;
	let stopping;

	return { run, track, start, stop, close, assertOpen,
		get active() { return !paused && !closed; },
		get closed() { return closed; }
	};

	function assertOpen() {
		if (closed)
			throw syncAbortError(undefined, 'Sync client closed.');
	}

	function track(value) {
		const promise = Promise.resolve(value);
		pending.add(promise);
		promise.then(() => pending.delete(promise), () => pending.delete(promise));
		return promise;
	}

	function run(fn, options = {}, allowPaused = false) {
		try {
			assertOpen();
			if (stopping || (paused && !allowPaused))
				throw syncAbortError(undefined, 'Sync client stopped. Call start() to resume.');
		}
		catch (error) { return Promise.reject(error); }
		const controller = createSyncAbortController();
		const external = options && options[syncAbortSignalSymbol];
		const abort = () => controller.abort(syncAbortError(external.reason));
		if (external) {
			if (external.aborted) abort();
			else external.addEventListener('abort', abort, { once: true });
		}
		controller.signal[syncWorkTrackerSymbol] = value => {
			if (external && external[syncWorkTrackerSymbol])
				external[syncWorkTrackerSymbol](value);
			return track(value);
		};
		controllers.add(controller);
		return track(Promise.resolve().then(() => {
			throwIfSyncAborted(controller.signal);
			return fn({ ...options, [syncAbortSignalSymbol]: controller.signal });
		}).finally(() => {
			controllers.delete(controller);
			if (external) external.removeEventListener('abort', abort);
		}));
	}

	function start(fn, options) {
		try {
			assertOpen();
			if (stopping)
				throw syncAbortError(undefined, 'Sync client is stopping. Await stop() before start().');
			paused = false;
		}
		catch (error) { return Promise.reject(error); }
		return run(fn, options).catch(error => {
			if (!(paused && isSyncAbortError(error))) throw error;
		});
	}

	function stop(stopScheduler = () => {}) {
		if (stopping) return stopping;
		paused = true;
		// Install the fence before abort listeners can synchronously call start().
		stopping = Promise.resolve().then(stopScheduler).then(async () => {
			// A cancelled operation can enqueue rollback/cleanup before settling.
			while (pending.size) await Promise.allSettled(Array.from(pending));
		}).finally(() => { stopping = undefined; });
		for (const controller of Array.from(controllers))
			controller.abort(syncAbortError(undefined, closed ? 'Sync client closed.' : 'Sync stopped.'));
		return stopping;
	}

	function close(stopScheduler) {
		closed = true;
		return stop(stopScheduler);
	}
}

module.exports = createSyncLifecycle;
