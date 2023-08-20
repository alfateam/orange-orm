const getTSDefinition = require('./getTSDefinition');
let hostLocal = _hostLocal;
const getMeta = require('./hostExpress/getMeta');

function hostExpress(client, options = {}) {
	if ('db' in options && (options.db ?? undefined) === undefined || !client.db)
		throw new Error('No db specified');
	const dbOptions = {db: options.db || client.db};
	let c = {};
	if (options.tables)
		for (let tableName in options.tables) {
			const tableOptions = {...dbOptions,...options, ...options.tables[tableName]};
			c[tableName] = hostLocal({...tableOptions, ...{ table: client.tables[tableName], isHttp: true, client }});
		}
	else
		for (let tableName in client.tables) {
			c[tableName] = hostLocal({...dbOptions,...options, ...{ table: client.tables[tableName], ...{baseFilter: options?.[tableName]?.baseFilter}, isHttp: true, client }});
		}

	async function handler(req, res) {
		if (req.method === 'POST')
			return post.apply(null, arguments);
		if (req.method === 'PATCH')
			return patch.apply(null, arguments);
		if (req.method === 'GET')
			return get.apply(null, arguments);
		if (req.method === 'OPTIONS')
			return handleOptions(req, res); // assuming the second argument is `response`

		else
			res.status(405).set('Allow', 'GET, POST, PATCH, OPTIONS').send('Method Not Allowed');
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
			response.json(await c[request.query.table].patch(request.body, request, response));
		}
		catch (e) {
			response.status(e.status || 500).send(e && e.stack);
		}
	}

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

			response.json(await c[request.query.table].post(request.body, request, response));
		}
		catch(e) {
			response.status(e.status || 500).send(e && e.stack);
		}

	}

	function handleOptions(req, response) {
		response.setHeader('Access-Control-Allow-Origin', '*'); // Adjust this as per your CORS needs
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS'); // And any other methods you support
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // And any other headers you expect in requests
		response.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight request for a day. Adjust as you see fit
		response.status(204).send(); // 204 No Content response for successful OPTIONS requests
	}

	return handler;
}

function _hostLocal() {
	hostLocal = require('./hostLocal');
	return hostLocal.apply(null, arguments);
}

module.exports = hostExpress;