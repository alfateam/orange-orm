const { syncAbortError, syncAbortSignalSymbol } = require('./syncAbort');

// One recovery fence per open sync client. Account policy and consent stay in apps.
function createSyncRecovery(lifecycle, stopScheduler, reset, recover, synchronize) {
	let state = { revision: 0, recovering: false, blocked: false, resetCount: 0, discarded: 0 };
	let pending;
	let lastReset;
	let schemaResetCompleted = false;
	let resumeAfterRecovery = false;
	let recoveryStopVersion;
	const listeners = new Set();
	const snapshot = () => ({ ...state });
	function publish(update) {
		state = { ...state, ...update, revision: state.revision + 1 };
		if (!lifecycle.closed) for (const listener of [...listeners]) call(listener);
	}
	function call(listener) { try { listener(snapshot()); } catch { /* Isolate observers. */ } }
	function assertReady() {
		if (state.recovering || state.blocked) {
			const error = new Error('Schema recovery requires an explicit recoverLocalSchema() or resetLocal() call.');
			error.code = 'ORANGE_SYNC_SCHEMA_RECOVERY_BLOCKED';
			error.cause = state.error;
			throw error;
		}
	}
	function execute(options = {}, discard = false) {
		try { lifecycle.assertOpen(); } catch (error) { return Promise.reject(error); }
		if (pending) {
			// Never turn a concurrent destructive reset into a non-destructive retry (or vice versa).
			return Promise.reject(Object.assign(new Error('Schema recovery is already running.'), { code: 'ORANGE_SYNC_RECOVERY_BUSY' }));
		}
		// Install the fence before stopping/aborting existing work. Reserve pending
		// before notifying observers, which may reenter recovery.
		pending = Promise.resolve().then(async () => {
			await stopped;
			lifecycle.assertOpen();
			if (version !== lifecycle.stopVersion) throw syncAbortError(undefined, 'Schema recovery stopped.');
			return lifecycle.run(async bound => {
				if (discard || !schemaResetCompleted) {
					lastReset = await (discard ? reset : recover)(bound);
					schemaResetCompleted = !discard || !options.tables;
					publish({ resetCount: state.resetCount + 1, discarded: state.discarded + (lastReset.discarded || 0) });
				}
				let downloaded;
				if (!discard && options.synchronize) downloaded = await synchronize({
					timeoutMs: bound.timeoutMs, [syncAbortSignalSymbol]: bound[syncAbortSignalSymbol]
				});
				return { ...lastReset, ...downloaded, sent: lastReset.sent || 0, discarded: lastReset.discarded || 0 };
			}, options, true, true);
		}).then(result => {
			if (resumeAfterRecovery && version === lifecycle.stopVersion) lifecycle.resume();
			publish({ recovering: false, blocked: false, error: undefined });
			return result;
		}, error => {
			if (schemaResetCompleted && error && error.code === 'ORANGE_SYNC_SCHEMA_MISMATCH')
				error = Object.assign(new Error('Schema still mismatches after recovery. A new application version may be required.'), {
					code: 'ORANGE_SYNC_SCHEMA_RECOVERY_FAILED', cause: error
				});
			publish({ recovering: false, blocked: true, error });
			throw error;
		}).finally(() => { pending = undefined; });
		resumeAfterRecovery = lifecycle.active || (state.blocked && recoveryStopVersion === lifecycle.stopVersion && resumeAfterRecovery);
		const stopped = lifecycle.stop(stopScheduler);
		const version = recoveryStopVersion = lifecycle.stopVersion;
		publish({ recovering: true, blocked: true, error: undefined });
		return pending;
	}
	return {
		assertReady,
		observeError(error) {
			if (lifecycle.closed || state.blocked || state.recovering || !error || error.code !== 'ORANGE_SYNC_SCHEMA_MISMATCH') return;
			// Detection itself fences callers, even when the application cannot
			// authorize a recovery attempt yet (for example, expired credentials).
			resumeAfterRecovery = lifecycle.active;
			void lifecycle.stop(stopScheduler).catch(() => {});
			recoveryStopVersion = lifecycle.stopVersion;
			publish({ blocked: true, error });
		},
		getState: async () => { lifecycle.assertOpen(); return snapshot(); },
		recover: options => execute(options),
		reset: options => execute(options, true),
		on(listener) {
			lifecycle.assertOpen();
			if (typeof listener !== 'function') return () => {};
			listeners.add(listener);
			Promise.resolve().then(() => { if (!lifecycle.closed && listeners.has(listener)) call(listener); });
			return () => listeners.delete(listener);
		},
		off: listener => listeners.delete(listener),
		close: () => listeners.clear()
	};
}
module.exports = createSyncRecovery;
