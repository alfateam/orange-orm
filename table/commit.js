var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');
var releaseDbClient = require('./releaseDbClient');

function commit() {
	pushCommand(commitCommand);
	return executeChanges().then(releaseDbClient);
}

module.exports = commit;