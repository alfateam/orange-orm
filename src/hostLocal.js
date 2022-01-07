let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let setSessionSingleton = require('./table/setSessionSingleton');
let tryGetSessionContext = require('./table/tryGetSessionContext');
let executeQuery = require('./query');

function hostLocal({ db, table, defaultConcurrency, concurrency, customFilters, baseFilter, strategy }) {
	let c = { get, post, patch, query};

	function get() {
		return getMeta(table);

	}
	async function patch(body) {
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}
		body = JSON.parse(body);
		let result;
		let c = tryGetSessionContext();

		if (c && c.poolFactory === db.poolFactory)
			await fn();
		else
			await db.transaction(fn);
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
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}
		body = JSON.parse(body);
		let result;
		let c = tryGetSessionContext();
		if (c && c.poolFactory === db.poolFactory)
			await fn();
		else
			await db.transaction(fn);
		return result;

		async function fn() {
			setSessionSingleton('ignoreSerializable', true);
			result = await executePath({ table, JSONFilter: body, customFilters, baseFilter, allowEverything: true });
		}
	}
	async function query() {
		let args = arguments;
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}
		let result;
		let c = tryGetSessionContext();
		if (c && c.poolFactory === db.poolFactory)
			await fn();
		else
			await db.transaction(fn);
		return result;

		async function fn() {
			result = await executeQuery.apply(null, args);
		}

	}

	return c;
}

module.exports = hostLocal;