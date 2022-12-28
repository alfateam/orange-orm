function httpAdapter(url, axios) {
	let c = {
		get,
		post,
		patch,
		query,
		express
	};

	return c;

	async function get() {
		const headers = {'Content-Type': 'application/json', 'Accept': 'application/json' };
		const res = await axios.request({baseURL: url, headers, method: 'get'});
		return res.data;
	}

	async function patch(body) {
		const headers = {'Content-Type': 'application/json'};
		const res = await axios.request({baseURL: url, headers, method: 'patch', data: body});
		return res.data;
	}

	async function post(body) {
		const headers = {'Content-Type': 'application/json'};
		const res = await axios.request({baseURL: url, headers, method: 'post', data: body});
		return res.data;
	}


	function query() {
		throw new Error('Queries are not supported through http');
	}

	function express() {
		throw new Error('Hosting in express is not supported on the client side');
	}
}

function createNetAdapter(url, options) {
	if (url && url.hostLocal)
		return url.hostLocal(options.tableOptions);
	else if (url &&  url.query)
		return url;
	else if (url &&  typeof url === 'function' && url().query)
		return url();
	else
		return httpAdapter(url, options.axios);
}

module.exports = createNetAdapter;