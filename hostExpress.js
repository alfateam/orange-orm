let express;
let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');

function hostExpress({db, table, defaultConcurrency, concurrency, customFilters, baseFilter}) {
	let router = express.Router();
	router.get('/', function(_req, response){
		try {
			if (!table)
				throw new Error('Table is not exposed');
			response.status(200).send(getMeta(table));
		}
		catch(e) {
			response.status(500).send(e && e.message);
		}
	});
	router.patch('/', async function(request, response){
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			await db.transaction(async() => {
				let patch = request.body.patch || request.body;
				let options = request.body.options || {};
				let _concurrency = options.concurrency || concurrency;
				let _defaultConcurrency = options.defaultConcurrency || defaultConcurrency;
				await table.patch(patch, {_defaultConcurrency, _concurrency});
			});
			response.status(204).send();
		}
		catch(e) {
			response.status(500).send(e && e.message);
		}
	});
	router.post('/', async function(request, response) {
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			let result;
			await db.transaction(async() => {
				result = await executePath({table, JSONFilter: request.body, customFilters, baseFilter, request, response});
			});
			response.json(result);
		}
		catch (e) {
			response.status(500).send(e && e.message);
		}
	});
	return router;
}

module.exports = function hostExpressLazy() {
	if (!express)
		express = require('express');
	return hostExpress.apply(null, arguments);
};