const executeChanges = require('./table/executeQueries/executeChanges');
const popChanges = require('./table/popChanges');
const getSessionSingleton = require('./table/getSessionSingleton');

function executeQueries(context, ...rest) {
	var changes = popChanges(context);

	return executeChanges(context, changes).then(onDoneChanges);

	function onDoneChanges() {
		var client = getSessionSingleton(context, 'dbClient');
		if (client && typeof client.function === 'function')
			return client.function.apply(client, rest);
		if (client && typeof client.createFunction === 'function')
			return client.createFunction.apply(client, rest);
		throw new Error('SQLite client does not support user-defined functions');
	}
}

module.exports = executeQueries;
