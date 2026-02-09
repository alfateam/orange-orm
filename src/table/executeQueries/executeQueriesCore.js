var executeQuery = require('./executeQuery');

function executeQueriesCore(context, queries) {
	var promises = [];
	var chain = Promise.resolve();
	for (var i = 0; i < queries.length; i++) {
		// Serialize execution while still returning an array of promises
		var q = chain.then(function(qi) {
			return executeQuery(context, qi);
		}.bind(null, queries[i]));
		promises.push(q);
		chain = q;
	}
	return promises;
}

module.exports = executeQueriesCore;
