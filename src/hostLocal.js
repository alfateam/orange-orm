let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');

function hostLocal({ db, table, defaultConcurrency, concurrency, customFilters, baseFilter, strategy }) {
	let c = {get, post, patch};

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
		await db.transaction(async() => {
			let patch = body.patch || body;
			let options = body.options || {};
			let _concurrency = options.concurrency || concurrency;
			let _defaultConcurrency = options.defaultConcurrency || defaultConcurrency;
			let _strategy = options.strategy || strategy;
			result = await table.patch(patch, { defaultConcurrencey:_defaultConcurrency, concurrency: _concurrency, strategy: _strategy });
		});
		return result;
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
		await db.transaction(async() => {
			result = await executePath({ table, JSONFilter: body, customFilters, baseFilter, allowEverything: true });
		});
		return result;
	}

	return c;
}

module.exports = hostLocal;