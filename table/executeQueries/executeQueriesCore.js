var executeQuery = require('./executeQuery');

function executeQueriesCore(queries) {
	var promises = [];
	for (var i = 0; i < queries.length; i++) {
		var q = executeQuery(queries[i]);
		promises.push(q);
	}
	return promises;
}

module.exports = executeQueriesCore;