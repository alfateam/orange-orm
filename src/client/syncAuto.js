const syncAutoStartSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.autoStart')
	: '__orangeOrmSyncClientAutoStart';
const {
	awaitWithSyncAbort,
	createSyncAbortController,
	isSyncAbortError,
	syncAbortError,
	syncAbortSignalSymbol,
	throwIfSyncAborted
} = require('./syncAbort');

function createSyncAuto(syncClient, getConfig, options = {}) {
	const timers = options.timers || globalThis;
	const onlineTarget = options.onlineTarget || (typeof globalThis !== 'undefined' ? globalThis : undefined);
	let running = false;
	let forceRunning = false;
	let activeRun = null;
	let initialSyncCompleted = false;
	let lifecycleVersion = 0;
	const pendingStartControllers = new Set();
	let intervalId = null;
	let unsubscribeOnline = null;

	return {
		start,
		startFromConfig,
		stop,
		isRunning,
		runNow
	};

	async function start(options) {
		return startCore(true, options);
	}

	async function startFromConfig(options) {
		return startCore(false, options);
	}

	async function startCore(forceEnabled, options) {
		const startVersion = lifecycleVersion;
		const externalSignal = options && options[syncAbortSignalSymbol];
		const controller = createSyncAbortController();
		let removeExternalAbort;
		if (externalSignal) {
			const abort = () => controller.abort(syncAbortError(externalSignal.reason));
			if (externalSignal.aborted)
				abort();
			else {
				externalSignal.addEventListener('abort', abort, { once: true });
				removeExternalAbort = () => externalSignal.removeEventListener('abort', abort);
			}
		}
		pendingStartControllers.add(controller);
		try {
			const signal = controller.signal;
			throwIfSyncAborted(signal);
			if (running) {
				if (activeRun)
					await awaitWithSyncAbort(activeRun.promise, signal);
				return;
			}
			const config = normalizeAutoConfig(await awaitWithSyncAbort(getConfig(), signal), { forceEnabled });
			if (startVersion !== lifecycleVersion)
				return;
			if (running) {
				if (activeRun)
					await awaitWithSyncAbort(activeRun.promise, signal);
				return;
			}
			if (!config.enabled)
				return;
			running = true;
			forceRunning = forceEnabled;
			if (config.intervalMs > 0 && timers && typeof timers.setInterval === 'function') {
				intervalId = timers.setInterval(() => {
					void runNow().catch(() => {});
				}, config.intervalMs);
			}
			subscribeOnline();
			await runNow(signal);
		}
		catch (error) {
			if (startVersion !== lifecycleVersion && isSyncAbortError(error))
				return;
			throw error;
		}
		finally {
			pendingStartControllers.delete(controller);
			if (removeExternalAbort)
				removeExternalAbort();
		}
	}

	async function stop() {
		lifecycleVersion += 1;
		for (const controller of pendingStartControllers)
			controller.abort(syncAbortError(undefined, 'Initial sync stopped.'));
		running = false;
		forceRunning = false;
		if (intervalId !== null && timers && typeof timers.clearInterval === 'function') {
			timers.clearInterval(intervalId);
			intervalId = null;
		}
		if (unsubscribeOnline) {
			unsubscribeOnline();
			unsubscribeOnline = null;
		}
		const run = activeRun;
		if (!run)
			return;
		if (run.initial)
			run.controller.abort(syncAbortError(undefined, 'Initial sync stopped.'));
		await run.promise.catch(() => {});
	}

	async function isRunning() {
		return running;
	}

	async function runNow(externalSignal) {
		if (activeRun)
			return activeRun.promise;
		const initial = !initialSyncCompleted;
		const controller = createSyncAbortController();
		let removeExternalAbort;
		if (externalSignal) {
			const abort = () => controller.abort(syncAbortError(externalSignal.reason));
			if (externalSignal.aborted)
				abort();
			else {
				externalSignal.addEventListener('abort', abort, { once: true });
				removeExternalAbort = () => externalSignal.removeEventListener('abort', abort);
			}
		}
		const run = {
			controller,
			initial,
			promise: null
		};
		activeRun = run;
		run.promise = runCycle(controller.signal)
			.then((result) => {
				if (initial)
					initialSyncCompleted = true;
				return result;
			})
			.finally(() => {
				if (removeExternalAbort)
					removeExternalAbort();
				if (activeRun === run)
					activeRun = null;
			});
		return run.promise;
	}

	async function runCycle(signal) {
		throwIfSyncAborted(signal);
		const config = normalizeAutoConfig(await awaitWithSyncAbort(getConfig(), signal), { forceEnabled: forceRunning });
		throwIfSyncAborted(signal);
		const syncOptions = { [syncAbortSignalSymbol]: signal };
		if (config.enabled && typeof options.runSync === 'function')
			return options.runSync(config, syncOptions);
		if (config.enabled)
			return syncClient.sync(syncOptions);
		return { skipped: true };
	}

	function subscribeOnline() {
		if (!onlineTarget || typeof onlineTarget.addEventListener !== 'function' || typeof onlineTarget.removeEventListener !== 'function')
			return;
		const onOnline = () => {
			if (running)
				void runNow().catch(() => {});
		};
		onlineTarget.addEventListener('online', onOnline);
		unsubscribeOnline = () => onlineTarget.removeEventListener('online', onOnline);
	}
}

function normalizeAutoConfig(syncConfig, options = {}) {
	const auto = syncConfig && syncConfig.auto;
	const forceEnabled = !!options.forceEnabled;
	if (!syncConfig || auto === false)
		return { enabled: !!syncConfig && forceEnabled, intervalMs: 30000 };
	if (auto === undefined || auto === true)
		return { enabled: true, intervalMs: 30000 };
	if (auto !== Object(auto))
		return { enabled: true, intervalMs: 30000 };
	const intervalMs = normalizeIntervalMs(auto.intervalMs);
	return {
		enabled: forceEnabled || auto.enabled !== false,
		intervalMs
	};
}

function normalizeIntervalMs(value) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0)
		return 30000;
	return parsed;
}

module.exports = {
	createSyncAuto,
	normalizeAutoConfig,
	syncAbortSignalSymbol,
	syncAutoStartSymbol
};
