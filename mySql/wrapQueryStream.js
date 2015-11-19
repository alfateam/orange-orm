var log = require('../table/log');

function wrapQueryStream(connection) {
	var runOriginalQuery = connection.query;
	return runQuery;

	function runQuery(query) {
		return connection.executeQuery(query).stream();	
	}
}

module.exports = wrapQueryStream;