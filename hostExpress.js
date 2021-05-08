let express;
let query = require('./query');

function hostExpress(options) {
	let { db, table, tables = [], allowSql } = options;
	let router = express.Router();
	if (table) {
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
					await table.patch(patch, options);
				});
				res.status(204).send();
			}
			catch (e) {
				res.status(500).send(e && e.message);
			}
		});
	}
	else {
		let tablesDictionary = {};
		for (let i = 0; i < tables.length; i++) {
			let table = tables[i];
			tablesDictionary[table._dbName] = table;
		}
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
				let body = req.body;
				let table = tablesDictionary[body.table];
				if (!table)
					throw new Error(`Table ${body.table} is not exposed`);
				//todo
				// let columnDiscriminators = body.columnDiscriminators;
				// let formulaDiscriminators = body.formulaDiscriminators;
				let filter = body.sqlWhere && {
					sql: body.sqlWhere,
					parameters: body.parameters
				};
				let strategy = body.strategy;

				await db.transaction(async() => {
					result = await table.getManyDto(filter, strategy);
				});
				res.json(result);
			}
			catch (e) {
				res.status(500).send(e && e.message);
			}
		});


		if (allowSql)
			router.put('/', async function(req, res) {
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
							sql: req.body.sql,
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