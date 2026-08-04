const syncAutoStartSymbol = typeof Symbol === 'function'
	? Symbol.for('orange-orm.syncClient.autoStart')
	: '__orangeOrmSyncClientAutoStart';

function createSyncAuto(syncClient, getConfig, options = {}) {
	const timers = options.timers || globalThis;
	const onlineTarget = options.onlineTarget || (typeof globalThis !== 'undefined' ? globalThis : undefined);
	let running = false;
	let forceRunning = false;
	let activeRun = null;
	let intervalId = null;
	let unsubscribeOnline = null;

	return {
		start,
		startFromConfig,
		stop,
		isRunning,
		runNow
	};

	async function start() {
		return startCore(true);
	}

	async function startFromConfig() {
		return startCore(false);
	}

	async function startCore(forceEnabled) {
		if (running) {
			if (activeRun)
				await activeRun;
			return;
		}
		const config = normalizeAutoConfig(await getConfig(), { forceEnabled });
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
		await runNow();
	}

	async function stop() {
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
	}

	async function isRunning() {
		return running;
	}

	async function runNow() {
		if (activeRun)
			return activeRun;
		activeRun = runCycle()
			.finally(() => {
				activeRun = null;
			});
		return activeRun;
	}

	async function runCycle() {
		const config = normalizeAutoConfig(await getConfig(), { forceEnabled: forceRunning });
		if (config.enabled && typeof options.runSync === 'function')
			return options.runSync(config);
		if (config.enabled)
			return syncClient.sync();
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
	syncAutoStartSymbol
};
