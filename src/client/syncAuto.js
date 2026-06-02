function createSyncAuto(syncClient, getConfig, options = {}) {
	const timers = options.timers || globalThis;
	const onlineTarget = options.onlineTarget || (typeof globalThis !== 'undefined' ? globalThis : undefined);
	let running = false;
	let activeRun = null;
	let intervalId = null;
	let unsubscribeOnline = null;

	return {
		start,
		stop,
		isRunning,
		runNow
	};

	async function start() {
		if (running)
			return activeRun || Promise.resolve();
		const config = normalizeAutoConfig(await getConfig());
		if (!config.enabled)
			return;
		running = true;
		if (config.intervalMs > 0 && timers && typeof timers.setInterval === 'function') {
			intervalId = timers.setInterval(() => {
				void runNow();
			}, config.intervalMs);
		}
		subscribeOnline();
		return runNow();
	}

	function stop() {
		running = false;
		if (intervalId !== null && timers && typeof timers.clearInterval === 'function') {
			timers.clearInterval(intervalId);
			intervalId = null;
		}
		if (unsubscribeOnline) {
			unsubscribeOnline();
			unsubscribeOnline = null;
		}
	}

	function isRunning() {
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
		const config = normalizeAutoConfig(await getConfig());
		let pushResult;
		if (config.push) {
			pushResult = await syncClient.push();
		}
		if (config.pull) {
			if (config.push && pushResult && pushResult.error)
				return pushResult;
			return syncClient.pull();
		}
		return pushResult || { skipped: true };
	}

	function subscribeOnline() {
		if (!onlineTarget || typeof onlineTarget.addEventListener !== 'function' || typeof onlineTarget.removeEventListener !== 'function')
			return;
		const onOnline = () => {
			if (running)
				void runNow();
		};
		onlineTarget.addEventListener('online', onOnline);
		unsubscribeOnline = () => onlineTarget.removeEventListener('online', onOnline);
	}
}

function normalizeAutoConfig(syncConfig) {
	const auto = syncConfig && syncConfig.auto;
	if (!syncConfig || auto === false)
		return { enabled: false, intervalMs: 30000, push: true, pull: true };
	if (auto === undefined || auto === true)
		return { enabled: true, intervalMs: 30000, push: true, pull: true };
	if (auto !== Object(auto))
		return { enabled: true, intervalMs: 30000, push: true, pull: true };
	const intervalMs = normalizeIntervalMs(auto.intervalMs);
	return {
		enabled: auto.enabled !== false,
		intervalMs,
		push: auto.push !== false,
		pull: auto.pull !== false
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
	normalizeAutoConfig
};
