var executeChanges = require('./executeQueries/executeChanges');
var flush = require('./commands/flush');
var executeQueriesCore = require('./executeQueries/executeQueriesCore');

function executeQueries(queries) {
	return flush().then(onDoneChanges); 

	function onDoneChanges() {
		return executeQueriesCore(queries);
	}

}

module.exports = executeQueries;