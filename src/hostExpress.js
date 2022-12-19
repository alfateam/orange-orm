const getTSDefinition = require('./getTSDefinition');
const hostLocal = require('./hostLocal');
const getMeta = require('./hostExpress/getMeta');

function hostExpress(client, options = {}) {
	if ('database' in options && (options.database ?? undefined) === undefined || !client.db)
		throw new Error('No database specified');
	const dbOptions = {db: options.db || client.db};
	let c = {};
	if (options.tables)
		for (let tableName in options.tables) {
			const tableOptions = {...dbOptions,...options, ...options.tables[tableName]};
			c[tableName] = hostLocal({...tableOptions, ...{ table: client.tables[tableName], isHttp: true }});
		}
	else
		for (let tableName in client.tables) {
			c[tableName] = hostLocal({...dbOptions,...options, ...{ table: client.tables[tableName], isHttp: true }});
		}

	async function handler(req) {
		if (req.method === 'POST')
			return post.apply(null, arguments);
		if (req.method === 'PATCH')
			return patch.apply(null, arguments);
		if (req.method === 'GET')
			return get.apply(null, arguments);
		else {
			const e = new Error('Unhandled method ' + req.method);
			// @ts-ignore
			e.status = 400;
			throw e;
		}
	}

	handler.db = handler;
	handler.dts = get;

	function get(request, response) {
		try {
			if (request.query.table) {
				if (!(request.query.table in c)) {
					let e = new Error('Table is not exposed or does not exist');
					// @ts-ignore
					e.status = 400;
					throw e;
				}

				const result = getMeta(client.tables[request.query.table]);
				response.setHeader('content-type', 'text/plain');
				response.status(200).send(result);
			}
			else {
				const isNamespace = request.query.isNamespace === 'true';
				let tsArg = Object.keys(c).map(x => {
					return {table: client.tables[x], customFilters: options?.tables?.[x].customFilters, name: x};
				});
				response.setHeader('content-type', 'text/plain');
				response.status(200).send(getTSDefinition(tsArg, {isNamespace, isHttp: true}));
			}
		}
		catch (e) {
			response.status(e.status || 500).send(e && e.stack);
		}
	}

	async function patch(request, response) {
		try {
			response.json(await c[request.query.table].patch(request.body));
		}
		catch (e) {
			response.status(e.status || 500).send(e && e.stack);
		}
	};

	async function post(request, response) {
		try {

			if (!request.query.table) {
				let e = new Error('Table not defined');
				// @ts-ignore
				e.status = 400;
				throw e;
			}
			else if (!(request.query.table in c)) {
				let e = new Error('Table is not exposed or does not exist');
				// @ts-ignore
				e.status = 400;
				throw e;
			}

			response.json(await c[request.query.table].post(request.body));
		}
		catch(e) {
			response.status(e.status || 500).send(e && e.stack);
		}

	};

	return handler;
}

module.exports = hostExpress;