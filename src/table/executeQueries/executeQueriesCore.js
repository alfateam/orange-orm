var executeQuery = require('./executeQuery');

async function executeQueriesCore(context, queries) {
	var results = [];
	for (var i = 0; i < queries.length; i++) {
		// Execute sequentially to avoid overlapping requests on a single connection
		var q = await executeQuery(context, queries[i]);
		results.push(q);
	}
	return results;
}

module.exports = executeQueriesCore;
