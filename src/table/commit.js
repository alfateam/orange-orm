let commitCommand = require('./commands/commitCommand');
let pushCommand = require('./commands/pushCommand');
let executeChanges = require('./executeQueries/executeChanges');
let releaseDbClient = require('./releaseDbClient');
let popChanges = require('./popChanges');
const getSessionSingleton = require('./getSessionSingleton');

function _commit(context, result) {
	let hookError;
	return popAndPushChanges()
		.then(callAfterCommit)
		.then(releaseDbClient.bind(null, context))
		.then(onReleased)
		.then(throwHookErrorIfAny);

	function onReleased() {
		return result;
	}

	function throwHookErrorIfAny(res) {
		if (hookError)
			throw hookError;
		return res;
	}

	function callAfterCommit() {
		const hook = getSessionSingleton(context, 'afterCommitHook');
		if (!hook)
			return Promise.resolve();
		return Promise.resolve()
			.then(() => hook())
			.catch((e) => {
				hookError = e;
			});
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
