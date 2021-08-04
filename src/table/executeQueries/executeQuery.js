var newResolver = require('./resolveExecuteQuery');

function executeQuery(query) {
	var resolver = newResolver(query);
	return new Promise(resolver);
}

module.exports = executeQuery;