const syncAbortSignalSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.abortSignal')
	: '__orangeOrmSyncClientAbortSignal';
const syncAbortCode = 'ORANGE_SYNC_ABORT';

function createSyncAbortController() {
	if (typeof AbortController === 'function')
		return new AbortController();

	const listeners = new Set();
	const signal = {
		aborted: false,
		reason: undefined,
		addEventListener(event, listener) {
			if (event === 'abort' && typeof listener === 'function')
				listeners.add(listener);
		},
		removeEventListener(event, listener) {
			if (event === 'abort')
				listeners.delete(listener);
		}
	};
	return {
		signal,
		abort(reason) {
			if (signal.aborted)
				return;
			signal.aborted = true;
			signal.reason = reason;
			for (const listener of Array.from(listeners))
				listener.call(signal, { type: 'abort', target: signal });
			listeners.clear();
		}
	};
}

function syncAbortError(reason, fallbackMessage = 'Sync stopped.') {
	const error = reason instanceof Error
		? reason
		: new Error(typeof reason === 'string' && reason.length > 0 ? reason : fallbackMessage);
	if (!(reason instanceof Error))
		error.name = 'AbortError';
	try {
		error.code = syncAbortCode;
	}
	catch (_error) {
		// Built-in error objects are writable in supported runtimes; retain the AbortError fallback otherwise.
	}
	return error;
}

function throwIfSyncAborted(signal) {
	if (signal && signal.aborted)
		throw syncAbortError(signal.reason);
}

function awaitWithSyncAbort(value, signal) {
	if (!signal)
		return Promise.resolve(value);
	throwIfSyncAborted(signal);
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (callback, result) => {
			if (settled)
				return;
			settled = true;
			signal.removeEventListener('abort', onAbort);
			callback(result);
		};
		const onAbort = () => finish(reject, syncAbortError(signal.reason));
		signal.addEventListener('abort', onAbort, { once: true });
		Promise.resolve(value).then(
			(result) => finish(resolve, result),
			(error) => finish(reject, error)
		);
	});
}

function isSyncAbortError(error) {
	return !!error && error.code === syncAbortCode;
}

module.exports = {
	awaitWithSyncAbort,
	createSyncAbortController,
	isSyncAbortError,
	syncAbortError,
	syncAbortSignalSymbol,
	throwIfSyncAborted
};
