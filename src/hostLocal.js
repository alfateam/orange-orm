let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let setSessionSingleton = require('./table/setSessionSingleton');
let executeQuery = require('./query');
let executeSqliteFunction = require('./sqliteFunction');
let hostExpress = require('./hostExpress');
const readonlyOps = ['getManyDto', 'getMany', 'aggregate', 'count'];
// { db, table, defaultConcurrency,
// 	concurrency,
// 	customFilters,
// 	baseFilter, strategy, transaction,
// 	readonly,
// 	disableBulkDeletes, isBrowser }
function hostLocal() {
	const _options = arguments[0];
	let { table, transaction, db, isHttp, hooks, client } = _options;
	const transactionHooks = hooks && hooks.transaction;
	const getTransactionHook = (name) =>
		(transactionHooks && transactionHooks[name]) || (hooks && hooks[name]);

	let c = { get, post, patch, query, sqliteFunction, express };

	function get() {
		return getMeta(table);

	}
	async function patch(body, _req, _res) {
		if (!table) {
			const error = new Error('Table is not exposed');
			// @ts-ignore
			error.status = 400;
			throw error;
		}
		body = typeof body === 'string' ? JSON.parse(body) : body;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			await db.transaction(fn);
		}
		return result;

		async function fn(context) {
			setSessionSingleton(context, 'ignoreSerializable', true);
			let patch = body.patch;
			result = await table.patch(context, patch, { ..._options, ...body.options, isHttp });
		}
	}

	async function post(body, request, response) {
		body = typeof body === 'string' ? JSON.parse(body) : body;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			const beforeBegin = getTransactionHook('beforeBegin');
			const afterBegin = getTransactionHook('afterBegin');
			const beforeCommit = getTransactionHook('beforeCommit');
			const afterCommit = getTransactionHook('afterCommit');
			const afterRollback = getTransactionHook('afterRollback');
			const hasTransactionHooks = !!(beforeBegin
				|| afterBegin
				|| beforeCommit
				|| afterCommit
				|| afterRollback);
			if (!hasTransactionHooks && readonlyOps.includes(body.path))
				await db.transaction({ readonly: true }, fn);
			else {
				await db.transaction(async (context) => {
					const hookDb = typeof client === 'function'
						? client({ transaction: (fn) => fn(context) })
						: (client || db);
					if (afterCommit)
						setSessionSingleton(context, 'afterCommitHook', () =>
							afterCommit(hookDb, request, response)
						);
					if (afterRollback)
						setSessionSingleton(context, 'afterRollbackHook', (error) =>
							afterRollback(hookDb, request, response, error)
						);
					if (beforeBegin)
						await beforeBegin(hookDb, request, response);
					if (afterBegin)
						await afterBegin(hookDb, request, response);
					await fn(context);
					if (beforeCommit)
						await beforeCommit(hookDb, request, response);
				});
			}

		}
		return result;

		async function fn(context) {
			setSessionSingleton(context, 'ignoreSerializable', true);
			const options = { ..._options, ...body.options, JSONFilter: body, request, response, isHttp };
			result = await executePath(context, options);
		}
	}
	async function query() {
		let args = arguments;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			result = await db.query.apply(null, arguments);
		}

		return result;

		async function fn(...args1) {
			result = await executeQuery.apply(null, [...args1, ...args]);
		}

	}

	async function sqliteFunction() {
		let args = arguments;
		let result;

		if (transaction)
			await transaction(fn);
		else {
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			result = await db.sqliteFunction.apply(null, arguments);
		}

		return result;

		async function fn(...args1) {
			result = await executeSqliteFunction.apply(null, [...args1, ...args]);
		}

	}

	function express(client, options) {
		return hostExpress(hostLocal, client, options);
	}

	return c;
}

module.exports = hostLocal;
