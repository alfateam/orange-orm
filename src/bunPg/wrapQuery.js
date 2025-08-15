'use strict';

const log = require('../table/log');
const replaceParamChar = require('../pg/replaceParamChar');
const tryGetSessionContext = require('../table/tryGetSessionContext');

function wrapQuery(context, connection) {
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
					if (th && !th.closing) return onCompleted(new Error('Already inside a transaction'), []);
					beginTransaction(connection).then(
						(_th) => {
							rdb.transactionHandler = _th;
							onCompleted(null, []);
						},
						(err) => onCompleted(err, [])
					);
					return;
				}

				if (cmd === 'COMMIT') {
					if (!th) return onCompleted(new Error('Cannot commit outside transaction'), []);
					try {
						th.closing = true;   // mark tx as closing; don’t reuse
						th.resolve();        // resolve the *inner* control promise -> triggers commit
						// IMPORTANT: wait for the *outer* promise (commit finished on the wire)
						await th.settled;
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(null, []);
					} catch (e) {
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(e, []);
					}
					return;
				}

				if (cmd === 'ROLLBACK') {
					if (!th) return onCompleted(new Error('Cannot rollback outside transaction'), []);
					try {
						th.closing = true;
						th.reject(new Error('__rollback__')); // reject inner promise -> triggers rollback
						// Wait for outer promise to settle (rollback finished)
						try {
							await th.settled;
						} catch (e) {
							// connection.begin() rejects on rollback; that’s expected
							if (e?.message !== '__rollback__') throw e;
						}
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(null, []);
					} catch (e) {
						th.closed = true;
						rdb.transactionHandler = undefined;
						onCompleted(e, []);
					}
					return;
				}
			}

			// --- regular query ---
			const conn = th && th.tx && !th.closing ? th.tx : connection;
			const result = params.length === 0
				? await conn.unsafe(sql)
				: await conn.unsafe(sql, params);

			onCompleted(null, result);
		} catch (e) {
			onCompleted(e);
		}
	}
}

function beginTransaction(connection) {
	let resolveCommit;
	let rejectRollback;
	let resolveBegin;
	let rejectBegin;

	// This promise is controlled by our code: resolve() -> COMMIT, reject() -> ROLLBACK
	const controlPromise = new Promise((res, rej) => {
		resolveCommit = res;
		rejectRollback = rej;
	});

	// We resolve this when Bun gives us the tx object
	const beginPromise = new Promise((res, rej) => {
		resolveBegin = res;
		rejectBegin = rej;
	});

	// Start the transaction
	const settled = connection.begin(async (tx) => {
		// hand back the handler
		resolveBegin({
			tx,
			resolve: resolveCommit,     // call to request COMMIT
			reject: rejectRollback,     // call to request ROLLBACK
			promise: controlPromise,    // (inner) resolves/rejects when we signal commit/rollback
			settled: null,              // will be set to the outer promise below
			closing: false,
			closed: false,
		});
		// keep tx open until caller resolves/rejects controlPromise
		return controlPromise;
	})
		.then(
			() => { /* commit finished */ },
			(e) => {
				// rollback or begin failure — propagate only non-sentinel errors
				if (e?.message !== '__rollback__') throw e;
			}
		);

	// Attach the outer promise to the handler once it exists
	settled.then(null, () => {}); // keep microtasks rolling
	beginPromise.then(
		(handler) => { handler.settled = settled; },
		() => {}
	);

	// Ensure beginPromise rejects if connection.begin() fails before callback runs
	settled.catch((e) => {
		// If callback never ran, resolveBegin is still undefined; reject beginPromise
		if (!resolveBegin) rejectBegin?.(e);
	});

	return beginPromise;
}

module.exports = wrapQuery;
