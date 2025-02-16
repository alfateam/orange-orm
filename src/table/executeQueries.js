var executeChanges = require('./executeQueries/executeChanges');
var popChanges = require('./popChanges');
var executeQueriesCore = require('./executeQueries/executeQueriesCore');

function executeQueries(context, queries) {
	var changes = popChanges(context);

	return executeChanges(context, changes).then(onDoneChanges);

	function onDoneChanges() {
		return executeQueriesCore(context, queries);
	}
}

module.exports = executeQueries;