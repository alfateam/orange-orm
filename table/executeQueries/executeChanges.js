var executeQuery = require('./executeQuery');
var newPromise = require('../promise');

function executeChanges(queries) {
	if (queries.length == 0)
		return newPromise();
	var i = -1;
	return execute();


	function execute() {
		i++;
		console.log(queries[i].sql());
		if (i+1 == queries.length )
			return executeQuery(queries[i]);
		else {
			return executeQuery(queries[i]).then(execute);
		}
			
	}
	
}

module.exports = executeChanges;