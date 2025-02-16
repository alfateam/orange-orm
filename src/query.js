var executeQueries = require('./table/executeQueries');
var wrapQuery = require('./query/wrapQuery');

function doQuery(context, query) {
	var wrappedQuery = wrapQuery(query);
	return executeQueries(context, [wrappedQuery]).then(unwrapResult);
}

function unwrapResult(results) {
	return results[0];
}

module.exports = doQuery;