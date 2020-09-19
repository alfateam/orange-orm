var executeQuery = require('./executeQuery');
var newPromise = require('../promise');

function executeChanges(queries) {
	if (queries.length === 0)
		return newPromise();
	var i = -1;
	return execute().then(emitChanged);


	function execute() {
		i++;
		if (i+1 === queries.length )
			return executeQuery(queries[i]);
		else {
			return executeQuery(queries[i]).then(execute);
		}
	}

	async function emitChanged() {
		for (let i = 0; i < queries.length; i++) {
			if (queries[i].emitChanged)
				await Promise.all(queries[i].emitChanged());
		}
	}


}

module.exports = executeChanges;