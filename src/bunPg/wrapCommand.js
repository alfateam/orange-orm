'use strict';

const log = require('../table/log');
const replaceParamChar = require('../pg/replaceParamChar');
const tryGetSessionContext = require('../table/tryGetSessionContext');

function wrapCommand(context, connection) {
	return runQuery;

	async function runQuery(query, onCompleted) {
		try {
			log.emitQuery({ sql: query.sql(), parameters: query.parameters });
			const sql = replaceParamChar(query, query.parameters);
			const params = Array.isArray(query.parameters) ? query.parameters : [];

			const rdb = tryGetSessionContext(context);
			let th = rdb.transactionHandler;

			// --- tx control (short statements, no params) ---
			if (sql.length < 18 && params.length === 0) {
				const cmd = sql.trim().toUpperCase();

				if (cmd === 'BEGIN' || cmd === 'BEGIN TRANSACTION') {
					if (th && !th.closing) return onCompleted(new Error('Already inside a transaction'), { affectedRows: 0 });
					beginTransaction(connection).then(
						(_th) => {
							rdb.transactionHandler = _th;
							onCompleted(null, { affectedRows: 0 });
						},
						(err) => onCompleted(err, { affectedRows: 0 })
					);
					return;
				}

				if (cmd === 'COMMIT') {
					if (!th) return onCompleted(new Error('Cannot commit outside transaction'), { affectedRows: 0 });
					try {
						th.closing = true;
						th.resolve();
						await th.settled;
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(null, { affectedRows: 0 });
					} catch (e) {
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(e, { affectedRows: 0 });
					}
					return;
				}

				if (cmd === 'ROLLBACK') {
					if (!th) return onCompleted(new Error('Cannot rollback outside transaction'), { affectedRows: 0 });
					try {
						th.closing = true;
						th.reject(new Error('__rollback__'));
						try {
							await th.settled;
						} catch (e) {
							if (e?.message !== '__rollback__') throw e;
						}
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(null, { affectedRows: 0 });
					} catch (e) {
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(e, { affectedRows: 0 });
					}
					return;
				}
			}

			// --- regular query ---
			const conn = th && th.tx && !th.closing ? th.tx : connection;
			const result = params.length === 0
				? await conn.unsafe(sql)
				: await conn.unsafe(sql, params);

			let affectedRows = 0;

			if (result != null) {
				if (typeof result.rowCount === 'number') {
					affectedRows = result.rowCount;
				} else if (typeof result.count === 'number') {
					affectedRows = result.count;
				} else if (typeof result.changes === 'number') {
					affectedRows = result.changes;
				} else if (typeof result.affectedRows === 'number') {
					affectedRows = result.affectedRows;
				}
			}

			onCompleted(null, { affectedRows });
		} catch (e) {
			onCompleted(e, { affectedRows: 0 });
		}
	}
}

function beginTransaction(connection) {
	let resolveCommit;
	let rejectRollback;
	let resolveBegin;
	let rejectBegin;

	const controlPromise = new Promise((res, rej) => {
		resolveCommit = res;
		rejectRollback = rej;
	});

	const beginPromise = new Promise((res, rej) => {
		resolveBegin = res;
		rejectBegin = rej;
	});

	const settled = connection.begin(async (tx) => {
		resolveBegin({
			tx,
			resolve: resolveCommit,
			reject: rejectRollback,
			promise: controlPromise,
			settled: null,
			closing: false,
			closed: false,
		});
		return controlPromise;
	}).then(
		() => {},
		(e) => {
			if (e?.message !== '__rollback__') throw e;
		}
	);

	settled.then(null, () => {});
	beginPromise.then(
		(handler) => { handler.settled = settled; },
		() => {}
	);

	settled.catch((e) => {
		if (!resolveBegin) rejectBegin?.(e);
	});

	return beginPromise;
}

module.exports = wrapCommand;
