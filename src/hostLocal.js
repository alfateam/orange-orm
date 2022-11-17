let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let setSessionSingleton = require('./table/setSessionSingleton');
let executeQuery = require('./query');
let hostExpress = require('./hostExpress');

function hostLocal({ db, table, defaultConcurrency, concurrency, customFilters, baseFilter, strategy, transaction }) {
	let c = { get, post, patch, query, express};

	function get() {
		return getMeta(table);

	}
	async function patch(body) {
		body = JSON.parse(body);
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
			let patch = body.patch || body;
			let options = body.options || {};
			let _concurrency = options.concurrency || concurrency;
			let _defaultConcurrency = options.defaultConcurrency || defaultConcurrency;
			let _strategy = options.strategy || strategy;
			result = await table.patch(patch, { defaultConcurrencey: _defaultConcurrency, concurrency: _concurrency, strategy: _strategy });
		}
	}

	async function post(body) {
		body = JSON.parse(body);
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
			result = await executePath({ table, JSONFilter: body, customFilters, baseFilter, isServerSide: true });
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
		let _options  = { db, table, defaultConcurrency, concurrency, customFilters, baseFilter, strategy };
		return hostExpress({..._options, ...options});
	}

	return c;
}

module.exports = hostLocal;