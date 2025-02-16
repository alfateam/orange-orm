var executeQuery = require('./executeQuery');

function executeQueriesCore(context, queries) {
	var promises = [];
	for (var i = 0; i < queries.length; i++) {
		var q = executeQuery(context, queries[i]);
		promises.push(q);
	}
	return promises;
}

module.exports = executeQueriesCore;