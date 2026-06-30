const { acquireSyncWrite } = require('../sync/writeGate');
const {
	createSyncTransactionContext,
	flushSyncTransactionContext,
	serializeSyncPayload,
	setSyncTransactionContext
} = require('../sync/operationContext');

function createDbWorkerHandler(client, options = {}) {
	if (!client)
		throw new Error('DB worker handler requires a client.');

	const transactions = new Map();
	const syncEventUnsubscribers = new Map();
	const postMessage = options.postMessage || ((message) => {
		const target = getPostTarget();
		if (target)
			target.postMessage(message);
	});

	if (options.autoStart !== false && client.syncClient && typeof client.syncClient.start === 'function')
		void client.syncClient.start();

	return {
		handleMessage,
		stop
	};

	async function handleMessage(event) {
		const message = event && event.data;
		if (!message || message.type !== 'orange-db-request')
			return;
		try {
			const result = await dispatch(message);
			postResponse(message.id, result);
		}
		catch (e) {
			postResponse(message.id, undefined, e);
		}
	}

	async function dispatch(message) {
		if (message.method === 'transaction.begin')
			return beginTransaction(message.transactionId, message.args && message.args[0]);
		if (message.method === 'transaction.syncContext')
			return setTransactionSyncContext(message.transactionId, message.args && message.args[0]);
		if (message.method === 'transaction.flushSyncContext')
			return flushTransactionSyncContext(message.transactionId, message.args && message.args[0]);
		if (message.method === 'transaction.commit')
			return endTransaction(message.transactionId, 'commit');
		if (message.method === 'transaction.rollback')
			return endTransaction(message.transactionId, 'rollback', message.error);
		if (message.method && message.method.startsWith('sync.'))
			return dispatchSync(message.method.slice(5), message.args);
		if (message.method === 'query')
			return callQuery(message.transactionId, message.args);
		if (message.method === 'sqliteFunction')
			return callSqliteFunction(message.transactionId, message.args);
		if (message.method === 'syncCommand')
			return callSyncCommand(message.transactionId, message.args);
		return callTable(message.method, message.tableName, message.transactionId, message.args);
	}

	async function beginTransaction(transactionId, txOptions) {
		const pool = await getPool();
		if (!pool.createTransaction)
			throw new Error('Transaction not supported by DB worker client.');
		if (transactions.has(transactionId))
			return { transactionId };
		const releaseSyncWrite = await acquireSyncWrite(pool, txOptions);
		let transaction;
		try {
			transaction = pool.createTransaction(txOptions);
		}
		catch (e) {
			releaseSyncWrite();
			throw e;
		}
		transaction.__orangeSyncWriteRelease = releaseSyncWrite;
		transactions.set(transactionId, transaction);
		return { transactionId };
	}

	async function setTransactionSyncContext(transactionId, sync) {
		const transaction = transactions.get(transactionId);
		if (!transaction)
			return { transactionId, missing: true };
		const syncContext = createSyncTransactionContext(serializeSyncPayload(sync));
		transaction.__orangeSyncTransactionContext = syncContext;
		await transaction((context) => {
			setSyncTransactionContext(context, syncContext);
		});
		return { transactionId };
	}

	async function flushTransactionSyncContext(transactionId, sync) {
		const transaction = transactions.get(transactionId);
		if (!transaction)
			return null;
		const syncContext = transaction.__orangeSyncTransactionContext || createSyncTransactionContext();
		syncContext.sync = serializeSyncPayload(sync);
		transaction.__orangeSyncTransactionContext = syncContext;
		return transaction((context) => {
			setSyncTransactionContext(context, syncContext);
			return flushSyncTransactionContext(context);
		});
	}

	async function endTransaction(transactionId, method, error) {
		const transaction = transactions.get(transactionId);
		if (!transaction)
			return { transactionId, missing: true };
		transactions.delete(transactionId);
		try {
			if (method === 'commit')
				await transaction(transaction.commit);
			else
				await transaction(transaction.rollback.bind(null, toError(error)));
		}
		finally {
			releaseSyncWrite(transaction);
		}
		return { transactionId };
	}

	function dispatchSync(method, args = []) {
		const syncClient = client.syncClient;
		if (!syncClient)
			throw new Error('Sync client is not configured in DB worker.');
		if (method === 'on')
			return subscribeSyncEvent(args[0]);
		if (method === 'off')
			return unsubscribeSyncEvent(args[0]);
		const fn = syncClient[method];
		if (typeof fn !== 'function')
			throw new Error(`Sync method "${method}" is not implemented.`);
		return fn.apply(syncClient, args);
	}

	function subscribeSyncEvent(event) {
		if (typeof event !== 'string' || syncEventUnsubscribers.has(event))
			return;
		if (!client.syncClient || typeof client.syncClient.on !== 'function')
			return;
		const unsubscribe = client.syncClient.on(event, (payload) => {
			postMessage({
				type: 'orange-db-event',
				event,
				payload
			});
		});
		syncEventUnsubscribers.set(event, unsubscribe);
	}

	function unsubscribeSyncEvent(event) {
		const unsubscribe = syncEventUnsubscribers.get(event);
		if (!unsubscribe)
			return;
		unsubscribe();
		syncEventUnsubscribers.delete(event);
	}

	async function callQuery(transactionId, args = []) {
		const transaction = transactions.get(transactionId);
		if (transaction)
			return (await host(undefined, transaction)).query.apply(null, args);
		return client.query.apply(null, args);
	}

	async function callSqliteFunction(transactionId, args = []) {
		const transaction = transactions.get(transactionId);
		if (transaction)
			return (await host(undefined, transaction)).sqliteFunction.apply(null, args);
		return client.function.apply(null, args);
	}

	async function callSyncCommand(transactionId, args = []) {
		const transaction = transactions.get(transactionId);
		return (await host(undefined, transaction)).syncCommand.apply(null, args);
	}

	async function callTable(method, tableName, transactionId, args = []) {
		if (!tableName)
			throw new Error('DB worker table request requires tableName.');
		const table = client.tables && client.tables[tableName];
		if (!table)
			throw new Error(`Table "${tableName}" is not configured in DB worker.`);
		const localHost = await host(table, transactions.get(transactionId));
		const fn = localHost[method];
		if (typeof fn !== 'function')
			throw new Error(`DB worker method "${method}" is not implemented.`);
		return fn.apply(null, args);
	}

	async function host(table, transaction) {
		const pool = await getPool();
		return pool.hostLocal({
			db: pool,
			table,
			transaction,
			client,
			syncTableName: getTableName(table)
		});
	}

	async function getPool() {
		let db = client.db || client;
		if (typeof db === 'function') {
			db = db();
			if (db && db.then)
				db = await db;
		}
		return db;
	}

	function getTableName(table) {
		if (!client.tables)
			return undefined;
		for (const name in client.tables) {
			if (client.tables[name] === table)
				return name;
		}
	}

	function stop() {
		for (const unsubscribe of syncEventUnsubscribers.values())
			unsubscribe();
		syncEventUnsubscribers.clear();
		for (const [id, transaction] of transactions) {
			transactions.delete(id);
			void Promise.resolve(transaction(transaction.rollback)).finally(() => releaseSyncWrite(transaction));
		}
		if (options.stopSyncClient !== false && client.syncClient && typeof client.syncClient.stop === 'function')
			client.syncClient.stop();
	}

	function postResponse(id, result, error) {
		postMessage({
			type: 'orange-db-response',
			id,
			result,
			error: error ? serializeError(error) : undefined
		});
	}

	function releaseSyncWrite(transaction) {
		const release = transaction && transaction.__orangeSyncWriteRelease;
		if (typeof release !== 'function')
			return;
		transaction.__orangeSyncWriteRelease = undefined;
		release();
	}
}

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

function toError(error) {
	if (!error)
		return undefined;
	const e = new Error(error.message || 'DB worker transaction failed.');
	if (error.name)
		e.name = error.name;
	if (error.stack)
		e.stack = error.stack;
	return e;
}

function getPostTarget() {
	if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
		return self;
	if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
		return globalThis;
}

module.exports = createDbWorkerHandler;
