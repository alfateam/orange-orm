let express;
let executePath = require('./hostExpress/executePath');
let getMeta = require('./hostExpress/getMeta');

function hostExpress({db, table, defaultConcurrency, concurrency}) {
	let router = express.Router();
	router.get('/', function(_req, res){
		try {
			if (!table)
				throw new Error('Table is not exposed');
			res.status(200).send(getMeta(table));
		}
		catch(e) {
			res.status(500).send(e && e.message);
		}
	});
	router.patch('/', async function(req, res){
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
					db = await dbPromise;
				else
					db = dbPromise;
			}
			let result;
			await db.transaction(async() => {
				result = await executePath(table, req.body);
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