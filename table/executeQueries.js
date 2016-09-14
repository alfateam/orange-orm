var executeChanges = require('./executeQueries/executeChanges');
var popChanges = require('./popChanges');
var executeQueriesCore = require('./executeQueries/executeQueriesCore');
var newParameterized = require('./query/newParameterized');

function executeQueries(queries) {
	var changes = popChanges();
	var lastChange = changes[changes.length-1];
	var query = queries[0];
	if (lastChange && lastChange.parameters.length===0  && query.parameters.length===0) {
		changes.pop();
		queries[0] = newParameterized( lastChange.sql() +  ';' + query.sql(), []);
	}

	return executeChanges(changes).then(onDoneChanges); 

	function onDoneChanges() {
		return executeQueriesCore(queries);
	}
}

module.exports = executeQueries;