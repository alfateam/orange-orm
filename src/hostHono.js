const getTSDefinition = require('./getTSDefinition');
const getMeta = require('./hostExpress/getMeta');

function hostHono(hostLocal, client, options = {}) {
	if ('db' in options && (options.db ?? undefined) === undefined || !client.db)
		throw new Error('No db specified');
	const dbOptions = { db: options.db || client.db };
	let c = {};
	const readonly = { readonly: options.readonly };
	const sharedHooks = options.hooks;
	for (let tableName in client.tables) {
		const tableOptions = options[tableName] || {};
		const hooks = tableOptions.hooks || sharedHooks;
		c[tableName] = hostLocal({
			...dbOptions,
			...readonly,
			...tableOptions,
			table: client.tables[tableName],
			isHttp: true,
			client,
			hooks
		});
	}

	async function handler(ctx) {
		const request = createRequest(ctx);
		const response = createResponse();

		try {
			if (request.method === 'POST')
				return await post(request, response);
			if (request.method === 'PATCH')
				return await patch(request, response);
			if (request.method === 'GET')
				return get(request, response);
			if (request.method === 'OPTIONS')
				return handleOptions(response);
			return response
				.status(405)
				.setHeader('Allow', 'GET, POST, PATCH, OPTIONS')
				.send('Method Not Allowed');
		}
		catch (e) {
			if (e.status === undefined)
				return response.status(500).send(e.message || e);
			return response.status(e.status).send(e.message);
		}
	}

	handler.db = handler;
	handler.dts = get;

	function get(request, response) {
		if (request.query.table) {
			if (!(request.query.table in c)) {
				let e = new Error('Table is not exposed or does not exist');
				// @ts-ignore
				e.status = 400;
				throw e;
			}

			const result = getMeta(client.tables[request.query.table]);
			response.setHeader('content-type', 'text/plain');
			return response.status(200).send(result);
		}
		const isNamespace = request.query.isNamespace === 'true';
		let tsArg = Object.keys(c).map(x => {
			return { table: client.tables[x], customFilters: options?.tables?.[x].customFilters, name: x };
		});
		response.setHeader('content-type', 'text/plain');
		return response.status(200).send(getTSDefinition(tsArg, { isNamespace, isHttp: true }));
	}

	async function patch(request, response) {
		const table = request.query.table;
		const body = await request.json();
		return response.json(await c[table].patch(body, request, response));
	}

	async function post(request, response) {
		if (!request.query.table) {
			let e = new Error('Table not defined');
			// @ts-ignore
			e.status = 400;
			throw e;
		}
		if (!(request.query.table in c)) {
			let e = new Error('Table is not exposed or does not exist');
			// @ts-ignore
			e.status = 400;
			throw e;
		}

		const body = await request.json();
		return response.json(await c[request.query.table].post(body, request, response));
	}

	function handleOptions(response) {
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		response.setHeader('Access-Control-Max-Age', '86400');
		return response.status(204).send('');
	}

	function createRequest(ctx) {
		let bodyPromise;
		const query = Object.fromEntries(new URL(ctx.req.url).searchParams.entries());
		const headers = {};
		for (const [name, value] of ctx.req.raw.headers.entries())
			headers[name] = value;
		return {
			method: ctx.req.method,
			query,
			headers,
			json: async () => {
				if (!bodyPromise)
					bodyPromise = ctx.req.json();
				return bodyPromise;
			}
		};
	}

	function createResponse() {
		let statusCode = 200;
		const headers = new Headers();
		return {
			status(code) {
				statusCode = code;
				return this;
			},
			setHeader(name, value) {
				headers.set(name, value);
				return this;
			},
			json(value) {
				if (!headers.has('content-type'))
					headers.set('content-type', 'application/json');
				return new Response(JSON.stringify(value), { status: statusCode, headers });
			},
			send(value) {
				if (typeof value === 'string') {
					if (!headers.has('content-type'))
						headers.set('content-type', 'text/plain');
					return new Response(value, { status: statusCode, headers });
				}
				if (!headers.has('content-type'))
					headers.set('content-type', 'application/json');
				return new Response(JSON.stringify(value), { status: statusCode, headers });
			}
		};
	}

	return handler;
}

module.exports = hostHono;
