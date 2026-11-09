const workerVisibility = require('./workerVisibility');

// Background time is not evidence of a dead worker. Also grant a fresh deadline
// after a large scheduler gap, even if the platform omitted visibility events.
function deadline(callback, timeoutMs, source) {
	const visibility = workerVisibility(source);
	const tickMs = Math.min(1000, timeoutMs);
	let timer, stopped = false, remaining = timeoutMs, last = Date.now();
	let visible = visibility.isVisible();
	const unsubscribe = visibility.subscribe(value => {
		visible = !!value;
		remaining = timeoutMs;
		last = Date.now();
		clearTimeout(timer);
		if (visible) schedule();
	});
	if (visible) schedule();
	return cancel;
	function schedule() {
		if (stopped) return;
		clearTimeout(timer);
		timer = setTimeout(tick, Math.min(tickMs, remaining));
		if (timer.unref) timer.unref();
	}
	function tick() {
		if (stopped) return;
		const now = Date.now(), elapsed = now - last;
		last = now;
		if (!visibility.isVisible()) { visible = false; remaining = timeoutMs; schedule(); return; }
		if (!visible || elapsed > Math.max(2000, tickMs * 3) || elapsed < 0) remaining = timeoutMs;
		else remaining -= elapsed;
		visible = true;
		if (remaining <= 0) { cancel(); callback(); }
		else schedule();
	}
	function cancel() { if (stopped) return; stopped = true; clearTimeout(timer); unsubscribe(); }
}

function withDeadline(promise, timeoutMs, source, error) {
	let cancel;
	const timeout = new Promise((_, reject) => { cancel = deadline(() => reject(error), timeoutMs, source); });
	return Promise.race([promise, timeout]).finally(() => cancel());
}

module.exports = { deadline, withDeadline };
