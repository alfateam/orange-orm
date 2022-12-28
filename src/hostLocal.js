let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let setSessionSingleton = require('./table/setSessionSingleton');
let executeQuery = require('./query');
let hostExpress = require('./hostExpress');

// { db, table, defaultConcurrency,
// 	concurrency,
// 	customFilters,
// 	baseFilter, strategy, transaction,
// 	readonly,
// 	disableBulkDeletes, isBrowser }
function hostLocal() {
	const _options = arguments[0];
	let { readonly, table, transaction, db } = _options;

	let c = { get, post, patch, query, express };

	function get() {
		return getMeta(table);

	}
	async function patch(body) {
		if (readonly) {
			const error = new Error('Table is readonly');
			// @ts-ignore
			error.status = 405;
			throw error;
		}
		else if (!table) {
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

		async function fn() {
			setSessionSingleton('ignoreSerializable', true);
			let patch = body.patch;
			result = await table.patch(patch, { ...body.options, ..._options });
		}
	}

	async function post(body) {
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

		async function fn() {
			setSessionSingleton('ignoreSerializable', true);
			const options = { ...body.options, ..._options, JSONFilter: body };
			result = await executePath(options);
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

		async function fn() {
			result = await executeQuery.apply(null, args);
		}

	}

	function express(options) {
		return hostExpress({ ..._options, ...options });
	}

	return c;
}

module.exports = hostLocal;