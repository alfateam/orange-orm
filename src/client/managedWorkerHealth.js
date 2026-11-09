const workerVisibility = require('./workerVisibility');
const { deadline } = require('./workerDeadline');

module.exports = function managedWorkerHealth(worker, options, fail, emit) {
	const config = options.healthCheck === false ? null : options.healthCheck || {};
	if (!config) return { close() {}, receive() {} };
	const visibility = workerVisibility(options.visibility);
	const intervalMs = positive(config.intervalMs, 15000), timeoutMs = positive(config.timeoutMs, 30000);
	let stopped = false, sequence = 0, active, cancel = () => {};
	let visible = visibility.isVisible();
	const unsubscribe = visibility.subscribe(value => {
		const resumed = !visible && !!value;
		visible = !!value;
		if (!visible) { cancel(); active = undefined; }
		else if (resumed) probe('resume');
	});
	// Defer until managed initialization and subscription setup have completed.
	if (visible) cancel = deadline(() => probe('startup'), 1, visibility);
	return { close, receive };
	function probe(reason) {
		if (stopped || !visibility.isVisible()) return;
		cancel();
		active = ++sequence;
		emit('worker-health', { phase: 'checking', requestId: active, reason });
		cancel = deadline(() => {
			const error = Object.assign(new Error('Sync worker or SQL transport stopped responding.'), { code: 'ORANGE_WORKER_UNRESPONSIVE' });
			emit('worker-health', { phase: 'unresponsive', requestId: active });
			close(); fail(error);
		}, timeoutMs, visibility);
		try { worker.postMessage({ type: 'orange-managed-sync-health-request', id: active }); }
		catch (error) { close(); fail(error); }
	}
	function receive(message) {
		if (stopped || active === undefined || message.type !== 'orange-managed-sync-health-response' || message.id !== active) return;
		cancel();
		emit('worker-health', { phase: 'responsive', requestId: active });
		active = undefined;
		cancel = deadline(() => probe('periodic'), intervalMs, visibility);
	}
	function close() { if (stopped) return; stopped = true; active = undefined; cancel(); unsubscribe(); }
};

function positive(value, fallback) { return Number.isFinite(value) && value > 0 ? value : fallback; }
