var executeChanges = require('./executeQueries/executeChanges');
var popChanges = require('./popChanges');
var executeQueriesCore = require('./executeQueries/executeQueriesCore');

function executeQueries(queries) {
	var changes = popChanges();
	var query = queries[0];

	return executeChanges(changes).then(onDoneChanges); 

	function onDoneChanges() {
		return executeQueriesCore(queries);
	}
}

module.exports = executeQueries;