function httpAdapter(baseURL, path, httpInterceptor) {
	let c = {
		get,
		post,
		patch,
		syncCommand,
		query,
		sqliteFunction,
		express
	};

	return c;

	async function get() {
		try {
			const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
			const res = await request({ baseURL, url: path, headers, method: 'get' });
			return res.data;
		}
		catch (e) {
			if (typeof e.response?.data === 'string')
				throw new Error(e.response.data.replace(/^Error: /, ''));
			else
				throw e;
		}

	}

	async function patch(body) {
		try {

			const headers = { 'Content-Type': 'application/json' };
			const res = await request({ baseURL, url: path, headers, method: 'patch', data: body });
			return res.data;
		}
		catch (e) {
			if (typeof e.response?.data === 'string')
				throw new Error(e.response.data.replace(/^Error: /, ''));
			else
				throw e;
		}


	}

	async function post(body) {
		try {
			const headers = { 'Content-Type': 'application/json' };
			const res = await request({ baseURL, url: path, headers, method: 'post', data: body });
			return res.data;
		}
		catch (e) {
			if (typeof e.response?.data === 'string')
				throw new Error(e.response.data.replace(/^Error: /, ''));
			else throw e;
		}
	}

	async function syncCommand(body) {
		try {
			const payload = typeof body === 'string' ? JSON.parse(body) : body;
			const name = payload && payload.name;
			if (typeof name !== 'string' || name.length === 0)
				throw new Error('Sync command requires a command name');
			const headers = { 'Content-Type': 'application/json' };
			const res = await axios.request(`?command=${encodeURIComponent(name)}`, {
				headers,
				method: 'post',
				data: body
			});
			return res.data;
		}
		catch (e) {
			if (typeof e.response?.data === 'string')
				throw new Error(e.response.data.replace(/^Error: /, ''));
			else throw e;
		}
	}


	function query() {
		throw new Error('Queries are not supported through http');
	}

	function sqliteFunction() {
		throw new Error('Sqlite Function is not supported through http');
	}

	function express() {
		throw new Error('Hosting in express is not supported on the client side');
	}

	async function request(config) {
		if (typeof fetch !== 'function')
			throw new Error('HTTP client requires fetch. Use a runtime with fetch support or provide a fetch polyfill.');

		config = await httpInterceptor.applyRequest(config);
		const response = await fetch(toUrl(config.baseURL, config.url), {
			method: config.method?.toUpperCase(),
			headers: config.headers,
			body: toBody(config.data)
		});
		const data = await readData(response);
		let result = {
			data,
			status: response.status,
			statusText: response.statusText,
			headers: toHeadersObject(response.headers),
			config
		};

		if (!response.ok)
			return httpInterceptor.applyResponseError(createHttpError(result));

		result = await httpInterceptor.applyResponse(result);
		return result;
	}
}

function toBody(data) {
	if (data === undefined)
		return undefined;
	if (typeof data === 'string')
		return data;
	return JSON.stringify(data);
}

function createHttpError(response) {
	const error = new Error('Request failed with status code ' + response.status);
	error.response = response;
	error.config = response.config;
	return error;
}

async function readData(response) {
	const text = await response.text();
	const contentType = response.headers.get('content-type') || '';
	if (text && (contentType.indexOf('application/json') !== -1 || looksLikeJson(text)))
		return JSON.parse(text);
	return text;
}

function looksLikeJson(text) {
	const value = text.trim();
	return value[0] === '{' || value[0] === '[';
}

function toHeadersObject(headers) {
	const result = {};
	headers.forEach((value, key) => result[key] = value);
	return result;
}

function toUrl(baseURL, path) {
	return new URL(path, baseURL).toString();
}

function netAdapter(url, tableName, { http, tableOptions }) {
	if (tableOptions.transaction?.done)
		delete tableOptions.transaction;

	let c = {
		get,
		post,
		patch,
		syncCommand,
		query,
		sqliteFunction
	};

	return c;

	async function get() {
		const adapter = await getInnerAdapter();
		return adapter.get.apply(null, arguments);
	}

	async function patch(_body) {
		const adapter = await getInnerAdapter();
		return adapter.patch.apply(null, arguments);
	}

	async function post(_body) {
		const adapter = await getInnerAdapter();
		return adapter.post.apply(null, arguments);
	}

	async function syncCommand(_body) {
		const adapter = await getInnerAdapter();
		if (!adapter.syncCommand)
			throw new Error('Sync commands are not supported through this adapter');
		return adapter.syncCommand.apply(null, arguments);
	}

	async function query() {
		const adapter = await getInnerAdapter();
		return adapter.query.apply(null, arguments);
	}

	async function sqliteFunction() {
		const adapter = await getInnerAdapter();
		return adapter.sqliteFunction.apply(null, arguments);
	}

	async function getInnerAdapter() {
		const db = await getDb();
		if (typeof db === 'string') {
			return httpAdapter(db, tableName === undefined ? '' : `?table=${tableName}`, http);
		}
		else if (db && db.hostLocal) {
			return db.hostLocal({ ...tableOptions, db, table: url });
		}
		else
			throw new Error('Invalid arguments');
	}

	async function getDb() {
		let db = tableOptions.db;
		if (db.transaction)
			return db;
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}

		return db;
	}

}

module.exports = netAdapter;
