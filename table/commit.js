var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');

function commit(result) {
	pushCommand(commitCommand);
	var changes = popChanges();
	return executeChanges(changes)
		.then(releaseDbClient)
		.then(onReleased)

	function onReleased() {
		if (process.domain)
			process.domain.exit();
		return result;
	}
}

module.exports = commit;