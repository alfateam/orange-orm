function wrapQueryStream(connection) {
	return runQuery;

	function runQuery(query, options) {
		return connection.executeQuery(query).stream(options);
	}
}

module.exports = wrapQueryStream;