var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var releaseDbClient = require('./releaseDbClient');
var flush = require('./commands/flush');

function commit() {
	pushCommand(commitCommand);
	return flush().then(releaseDbClient);
}

module.exports = commit;