function parseSearchPathParam(connectionString = '') {
	const [, queryString] = connectionString.split('?');
	if (!queryString)
		return;
	const params = new URLSearchParams(queryString);
	const searchPath = params.get('search_path');
	return searchPath;
}

module.exports = parseSearchPathParam;