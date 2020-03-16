let express;

function hostExpress(db, table) {
	let router = express.Router();
	router.patch('/', async function(req, res){
		try {
			await db.transaction(async() => {
				let patch = req.body;
				await table.patch(patch);
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