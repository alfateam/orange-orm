var executeQuery = require('./executeQueries/executeQuery');
var promise = require('./promise');

function executeQueries(queries) {
	var promises = [];
	for (var i = 0; i < queries.length; i++) {
		var q = executeQuery(queries[i]);
		promises.push(q);
	};
	return promise.all(promises);
}

module.exports = executeQueries;