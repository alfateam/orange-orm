var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');

function commit() {
	pushCommand(commitCommand);
	var changes = popChanges();
	return executeChanges(changes).then(releaseDbClient);
}

module.exports = commit;