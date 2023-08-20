const _axios = require('axios');
function httpAdapter(baseURL, path, axiosInterceptor) {
	//@ts-ignore
	const axios = _axios.default ? _axios.default.create({baseURL}) : _axios.create({baseURL});
	axiosInterceptor.setInstance(axios);

	let c = {
		get,
		post,
		patch,
		query,
		express
	};

	return c;

	async function get() {
		const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
		const res = await axios.request(path, {  headers, method: 'get' });
		return res.data;
	}

	async function patch(body) {
		const headers = { 'Content-Type': 'application/json' };
		const res = await axios.request(path, { headers, method: 'patch', data: body });
		return res.data;
	}

	async function post(body) {
		const headers = { 'Content-Type': 'application/json' };
		const res = await axios.request(path, { headers, method: 'post', data: body });
		return res.data;
	}


	function query() {
		throw new Error('Queries are not supported through http');
	}

	function express() {
		throw new Error('Hosting in express is not supported on the client side');
	}
}

function netAdapter(url, { axios, tableOptions }) {
	let c = {
		get,
		post,
		patch,
		query
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

	async function query() {
		const adapter = await getInnerAdapter();
		return adapter.query.apply(null, arguments);
	}

	async function getInnerAdapter() {
		const db = await getDb();
		if (typeof db === 'string') {
			url = db + url;
			return httpAdapter(db, url, axios);
		}
		else if (db && db.transaction) {
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