let express;

function hostExpress(db, table, concurrency) {
	let router = express.Router();
	router.patch('/', async function(req, res){
		try {
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}
			await db.transaction(async() => {
				let patch = req.body;
				await table.patch(patch, concurrency);
			});
			res.sendStatus(204);
		}
		catch(e) {
			res.status(500).send(e && e.message);
		}
	});
	return router;
}

module.exports = function hostExpressLazy(db, table, options) {
	if (!express)
		express = require('express');
	return hostExpress(db, table, options);
};