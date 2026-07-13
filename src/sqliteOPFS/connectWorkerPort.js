function connectSqliteOPFSWorker(worker) {
	if (!worker || typeof worker.postMessage !== 'function')
		throw new Error('sqliteOPFS worker port requires a Worker-like object.');
	if (typeof MessageChannel === 'undefined')
		throw new Error('sqliteOPFS worker port requires MessageChannel support.');
	const channel = new MessageChannel();
	worker.postMessage({
		type: 'orange-sqlite-opfs-connect'
	}, [channel.port2]);
	if (typeof channel.port1.start === 'function')
		channel.port1.start();
	return channel.port1;
}

module.exports = connectSqliteOPFSWorker;
