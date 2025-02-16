var newResolver = require('./resolveExecuteQuery');

function executeQuery(context, query) {
	var resolver = newResolver(context, query);
	return new Promise(resolver);
}

module.exports = executeQuery;