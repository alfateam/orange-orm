let commitCommand = require('./commands/commitCommand');
let pushCommand = require('./commands/pushCommand');
let executeChanges = require('./executeQueries/executeChanges');
let releaseDbClient = require('./releaseDbClient');
let popChanges = require('./popChanges');
const getSessionSingleton = require('./getSessionSingleton');

function commit(result) {
	return popAndPushChanges()
		.then(releaseDbClient)
		.then(onReleased);

	function onReleased() {
		return result;
	}

	async function popAndPushChanges() {
		let changes = popChanges();
		while (changes.length > 0) {
			await executeChanges(changes);
			changes = popChanges();
		}
		if (!getSessionSingleton('readonly'))
			pushCommand(commitCommand);
		return executeChanges(popChanges());
	}
}

module.exports = function(result) {
	return Promise.resolve()
		.then(() => commit(result));
};
