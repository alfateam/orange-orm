const log = require('../table/log');
const replaceParamChar = require('../pg/replaceParamChar');
const tryGetSessionContext = require('../table/tryGetSessionContext');

function wrapQuery(context, connection) {
	return runQuery;

	async function runQuery(query, onCompleted) {
		try {

			const sql = replaceParamChar(query, query.parameters);
			let rdb = tryGetSessionContext(context);
			let transactionHandler = rdb.transactionHandler;
			log.emitQuery({ sql, parameters: query.parameters });

			if (sql.length < 18 && query.parameters.length === 0) {
				if (sql === 'BEGIN TRANSACTION' || sql === 'BEGIN') {
					if (transactionHandler)
						return onCompleted(new Error('Already inside a transaction'), []);
					beginTransaction(connection).then(_transactionHandler => {
						rdb.transactionHandler = _transactionHandler;
						onCompleted(null, []);
					}, onCompleted);
					return;
				}
				else if (sql === 'COMMIT') {
					if (!transactionHandler)
						return onCompleted(new Error('Cannot commit outside transaction'), []);
					transactionHandler.resolve();
					transactionHandler.promise.then(() => onCompleted(null, []), err => onCompleted(err, []));
					return;
				}
				else if (sql === 'ROLLBACK') {
					if (!transactionHandler)
						return onCompleted(new Error('Cannot rollback outside transaction'), []);
					transactionHandler.reject(new Error('rollback'));
					transactionHandler.promise.then(null, (err) => {
						if (err.message === 'rollback')
							onCompleted(null, []);
						else
							onCompleted(err, []);
					});
					return;
				}
			}

			let result;
			const _connection = transactionHandler?.tx || connection;
			if (query.parameters.length === 0)
				result = await _connection.unsafe(sql);
			else
				result = await _connection.unsafe(sql, query.parameters);
			onCompleted(null, result);
		}
		catch (e) {
			onCompleted(e);
		}
	}

}

function beginTransaction(connection) {

	let beginIsResolved = false;
	let resolve;
	let reject;
	let resolveBegin;
	let rejectBegin;

	let sqlPromise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	let beginPromise = new Promise((res,rej) => {
		resolveBegin = res;
		rejectBegin = rej;
	});
	connection.begin(async (tx) => {
		beginIsResolved = true;
		resolveBegin({
			tx,
			resolve,
			reject,
			promise: sqlPromise,
		});
		return sqlPromise;
	}).then(null,
		e => {
			if (!beginIsResolved)
				rejectBegin(e);
			throw e;
		});
	return beginPromise;
}

module.exports = wrapQuery;