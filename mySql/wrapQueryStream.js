var log = require('../table/log');

function wrapQueryStream(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query, options) {
		return connection.executeQuery(query).stream(options);	
	}
}

module.exports = wrapQueryStream;