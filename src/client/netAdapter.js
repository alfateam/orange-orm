require('isomorphic-fetch');

function httpAdapter(url, {beforeRequest : _beforeRequest, beforeResponse: _beforeResponse}) {
	let c = {
		get,
		post,
		patch,
		query,
		express
	};

	return c;


	async function get() {
		// eslint-disable-next-line no-undef
		let headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.append('Accept', 'application/json');
		let request = { url, init: { method: 'GET', headers } };
		let response = await sendRequest(request);
		return handleResponse(response);
	}

	async function patch(body) {
		// eslint-disable-next-line no-undef
		var headers = new Headers();
		headers.append('Content-Type', 'application/json');
		let request = { url, init: { method: 'PATCH', headers, body } };
		let response = await sendRequest(request);
		return handleResponse(response);
	}

	async function post(body) {
		// eslint-disable-next-line no-undef
		var headers = new Headers();
		headers.append('Content-Type', 'application/json');
		let response = await sendRequest({ url, init: { method: 'POST', headers, body } });
		return handleResponse(response);
	}

	async function sendRequest({ url, init }, { attempts = 0 } = {}) {
		if (_beforeRequest) {
			init = await _beforeRequest(init) || init;
		}
		// eslint-disable-next-line no-undef
		let request = new Request(url, init);
		// eslint-disable-next-line no-undef
		return beforeResponse(await fetch(request), { url, init, attempts });
	}

	async function beforeResponse(response, { url, init, attempts }) {
		if (!_beforeResponse)
			return response;

		let shouldRetry;
		await _beforeResponse(response.clone(), { retry, attempts, request: init });
		if (shouldRetry)
			return sendRequest({ url, init }, { attempts: ++attempts });
		return response;

		function retry() {
			shouldRetry = true;
		}
	}

	async function handleResponse(response) {
		if (response.status >= 200 && response.status < 300) {
			return response.json();
		}
		else {
			let msg = response.text && await response.text() || `Status ${response.status} from server`;
			let e = new Error(msg);
			e.status = response.status;
			throw e;
		}
	}

	function query() {
		throw new Error('Queries are not supported through http');
	}

	function express() {
		throw new Error('Hosting in express is not supported on the client side');
	}
}

function createNetAdapter(url, options = {}) {
	if (url && url.hostLocal)
		return url.hostLocal(options.tableOptions);
	else if (url &&  url.query)
		return url;
	else if (url &&  typeof url === 'function' && url().query)
		return url();
	else
		return httpAdapter(url, options);
}

module.exports = createNetAdapter;