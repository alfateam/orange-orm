var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');

function commit() {
	pushCommand(commitCommand);
	return executeChanges();
}

module.exports = commit;