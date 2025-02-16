let commitCommand = require('./commands/commitCommand');
let pushCommand = require('./commands/pushCommand');
let executeChanges = require('./executeQueries/executeChanges');
let releaseDbClient = require('./releaseDbClient');
let popChanges = require('./popChanges');
const getSessionSingleton = require('./getSessionSingleton');

function _commit(context, result) {
	return popAndPushChanges()
		.then(releaseDbClient.bind(null, context))
		.then(onReleased);

	function onReleased() {
		return result;
	}

	async function popAndPushChanges() {
		let changes = popChanges(context);
		while (changes.length > 0) {
			await executeChanges(context, changes);
			changes = popChanges(context);
		}
		if (!getSessionSingleton(context, 'transactionLess'))
			pushCommand(context, commitCommand);
		return executeChanges(context, popChanges(context));
	}
}

function commit(context, result) {
	return Promise.resolve()
		.then(() => _commit(context, result));
}

module.exports = commit;
