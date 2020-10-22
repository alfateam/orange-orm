let commitCommand = require('./commands/commitCommand');
let pushCommand = require('./commands/pushCommand');
let executeChanges = require('./executeQueries/executeChanges');
let releaseDbClient = require('./releaseDbClient');
let popChanges = require('./popChanges');

function commit(result) {
	return popAndPushChanges()
		.then(releaseDbClient)
		.then(onReleased)

	function onReleased() {
		return result;
	}

	async function popAndPushChanges() {
		let changes = popChanges();
		while (changes.length > 0) {
			await executeChanges(changes);
			changes = popChanges();
		}
		pushCommand(commitCommand);
		return executeChanges(popChanges());
	}
}

module.exports = commit;