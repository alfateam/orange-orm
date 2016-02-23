var executeQueries = require('./table/executeQueries');
var wrapQuery = require('./query/wrapQuery');

function query(query) {
	var wrappedQuery = wrapQuery(query);
	return executeQueries([wrappedQuery]).then(unwrapResult);
}

function unwrapResult(results) {
	return results[0];
}

module.exports = query;