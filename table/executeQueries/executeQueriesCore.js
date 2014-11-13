var executeQuery = require('./executeQuery');
var promise = require('../promise');

function executeQueriesCore(queries) {
	var promises = [];
	for (var i = 0; i < queries.length; i++) {
		var q = executeQuery(queries[i]);
		promises.push(q);
	}
	return promise.all(promises);
}

module.exports = executeQueriesCore;