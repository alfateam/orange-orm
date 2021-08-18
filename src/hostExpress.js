let express;
let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');
let getTSDefinition = require('./hostExpress/getTSDefinition');

function hostExpress({ db, table, defaultConcurrency, concurrency, customFilters, baseFilter, strategy }) {
	let router = express.Router();
	router.get('/', function(_req, response) {
		try {
			if (!table)
				throw new Error('Table is not exposed');

			if ((_req.headers.accept || '').indexOf('application/json') > -1)
				response.status(200).send(getMeta(table));
			else {
				response.setHeader('content-type', 'text/plain');
				response.status(200).send(getTSDefinition(table, customFilters, _req));
			}
		}
		catch (e) {
			response.status(500).send(e && e.stack);
		}
	});
	router.patch('/', async function(request, response) {
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db(request, response);
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			let result;
			await db.transaction(async() => {
				let patch = request.body.patch || request.body;
				let options = request.body.options || {};
				let _concurrency = options.concurrency || concurrency;
				let _defaultConcurrency = options.defaultConcurrency || defaultConcurrency;
				let _strategy = options.strategy || strategy;
				result = await table.patch(patch, { defaultConcurrencey: _defaultConcurrency, concurrency: _concurrency, strategy: _strategy });
			});

			response.status(200).send(result);
		}
		catch (e) {
			response.status(500).send(e && e.stack);
		}
	});
	router.post('/', async function(request, response) {
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db(request, response);
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			let result;
			await db.transaction(async() => {
				result = await executePath({ table, JSONFilter: request.body, customFilters, baseFilter, request, response });
			});
			response.json(result);
		}
		catch (e) {
			response.status(500).send(e && e.stack);
		}
	});
	return router;
}

module.exports = function hostExpressLazy() {
	if (!express)
		express = require('express');
	return hostExpress.apply(null, arguments);
};