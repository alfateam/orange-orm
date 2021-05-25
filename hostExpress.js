let express;
let createFilter = require('./hostExpress/createFilter');

function hostExpress({db, table, defaultConcurrency, concurrency}) {
	let router = express.Router();
	router.patch('/', async function(req, res){
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					// eslint-disable-next-line require-atomic-updates
					db = await dbPromise;
				else
					db = dbPromise;
			}
			await db.transaction(async() => {
				let patch = req.body;
				await table.patch(patch, {defaultConcurrency, concurrency});
			});
			res.status(204).send();
		}
		catch(e) {
			res.status(500).send(e && e.message);
		}
	});
	router.post('/', async function(req, res) {
		try {
			if (!table)
				throw new Error('Table is not exposed');
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					// eslint-disable-next-line require-atomic-updates
					db = await dbPromise;
				else
					db = dbPromise;
			}
			let result;
			let body = req.body;
			// let filter = createFilter(table, body.filter);
			let strategy = body.strategy;

			await db.transaction(async() => {
				result = await createFilter(req.filter, body.strategy);
			});
			res.json(result);
		}
		catch (e) {
			console.log(e.stack);
			res.status(500).send(e && e.message);
		}
	});
	return router;
}

module.exports = function hostExpressLazy() {
	if (!express)
		express = require('express');
	return hostExpress.apply(null, arguments);
};