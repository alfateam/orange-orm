var newResolver = require('./executeQuery/resolveExecuteQuery');
var newPromise = require('./promise');

function executeQuery(query) {
	var resolver = newResolver(query);
	return newPromise(resolver);
}

module.exports = executeQuery;