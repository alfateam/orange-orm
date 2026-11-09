const { Worker } = require('node:worker_threads');
const path = require('node:path');
module.exports = function nativeWorkerHarness() {
	const gate = new SharedArrayBuffer(4);
	const events = new EventTarget();
	const native = new Worker(path.join(__dirname, 'nativeSyncWorker.cjs'), { workerData: { gate } });
	let terminated = false;
	native.on('message', data => events.dispatchEvent(new MessageEvent('message', { data })));
	native.on('error', error => events.dispatchEvent(Object.assign(new Event('error'), { error })));
	native.on('exit', code => { if (!terminated) events.dispatchEvent(Object.assign(new Event('error'), { error: new Error(`Worker exited: ${code}`) })); });
	return {
		addEventListener: events.addEventListener.bind(events),
		removeEventListener: events.removeEventListener.bind(events),
		postMessage: native.postMessage.bind(native),
		terminate() { terminated = true; Atomics.store(new Int32Array(gate), 0, 0); return native.terminate(); },
		crash() { return native.terminate(); },
		pauseProcessing() {
			Atomics.store(new Int32Array(gate), 0, 1);
			return new Promise(resolve => {
				const handler = event => { if (event.data.type === 'test-sync-processing') { events.removeEventListener('message', handler); resolve(); } };
				events.addEventListener('message', handler);
			});
		},
		resumeProcessing() { Atomics.store(new Int32Array(gate), 0, 0); }
	};
};
