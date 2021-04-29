let express;
let query = require('./query');

function hostExpress({ db, table, defaultConcurrency, concurrency }) {
	let router = express.Router();
	if (table)
		router.patch('/', async function(req, res) {
			try {
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
					await table.patch(patch, { defaultConcurrency, concurrency });
				});
				res.status(204).send();
			}
			catch (e) {
				res.status(500).send(e && e.message);
			}
		});
	else {
		router.post('/', async function(req, res) {
			try {
				if (typeof db === 'function') {
					let dbPromise = db();
					if (dbPromise.then)
						// eslint-disable-next-line require-atomic-updates
						db = await dbPromise;
					else
						db = dbPromise;
				}
				let result;
				await db.transaction(async() => {
					result = await query({
						query: req.body.query,
						parameters: req.body.parameters
					});
				});
				res.json(result);
			}
			catch (e) {
				res.status(500).send(e && e.message);
			}
		});

	}
	return router;
}

module.exports = function hostExpressLazy() {
	if (!express)
		express = require('express');
	return hostExpress.apply(null, arguments);
};