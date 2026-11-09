// Out-of-band transport probes must not queue behind a transaction checkout.
// A successful reply proves channel liveness, not successful SQL execution.
module.exports = function managedSyncHealthResponder(ports, reply) {
	let current;
	for (const port of ports) {
		port.addEventListener('message', ({ data }) => {
			if (!current || data?.type !== 'orange-sqlite-health-response' || data.id !== current.id) return;
			current.waiting.delete(port);
			finish();
		});
		port.start();
	}
	return message => {
		if (message?.type !== 'orange-managed-sync-health-request') return false;
		current = { id: message.id, waiting: new Set(ports) };
		for (const port of ports) port.postMessage({ type: 'orange-sqlite-health-request', id: message.id });
		finish();
		return true;
	};
	function finish() {
		if (!current || current.waiting.size) return;
		reply({ type: 'orange-managed-sync-health-response', id: current.id });
		current = undefined;
	}
};
