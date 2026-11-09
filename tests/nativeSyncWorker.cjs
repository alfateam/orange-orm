const { parentPort, locks, workerData } = require('node:worker_threads');
Object.defineProperty(globalThis, 'navigator', { value: { locks }, configurable: true });
globalThis.postMessage = message => parentPort.postMessage(message);
const realFetch = globalThis.fetch;
const gate = new Int32Array(workerData.gate);
globalThis.fetch = async (...args) => {
	const response = await realFetch(...args);
	// The sync transport uses response.text(). Stall that processing in the real
	// worker to prove that it does not own the GUI/host event loop or read queue.
	for (const method of ['text', 'json']) {
		const read = response[method].bind(response);
		response[method] = async () => {
			const value = await read();
			if (Atomics.load(gate, 0) === 1) {
				parentPort.postMessage({ type: 'test-sync-processing' });
				const deadline = Date.now() + 10000;
				while (Atomics.load(gate, 0) === 1 && Date.now() < deadline) { /* deliberately busy worker */ }
			}
			return value;
		};
	}
	return response;
};
parentPort.on('message', message => globalThis.onmessage({ data: message }));
require('../src/client/managedSyncWorkerEntry');
