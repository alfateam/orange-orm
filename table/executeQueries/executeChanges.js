var executeQuery = require('./executeQuery');
var newPromise = require('../promise');

function executeChanges(queries) {
	if (queries.length === 0)
		return newPromise();
	var i = -1;
	return execute().then(emitChanged);


	function execute() {
		i++;
		if (i + 1 === queries.length)
			return executeQuery(queries[i]).then(notifyListener);
		else {
			return executeQuery(queries[i]).then(notifyListener).then(execute);
		}
	}

	function notifyListener(result) {
		if (result && queries[i].onResult)
			queries[i].onResult(result);
	}

	async function emitChanged() {
		for (let i = 0; i < queries.length; i++) {
			if (queries[i].emitChanged)
				await Promise.all(queries[i].emitChanged());
		}
	}


}

module.exports = executeChanges;