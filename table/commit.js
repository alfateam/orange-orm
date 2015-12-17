var commitCommand = require('./commands/commitCommand');
var pushCommand = require('./commands/pushCommand');
var executeChanges = require('./executeQueries/executeChanges');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');
var getSessionSingleton = require('./getSessionSingleton');

function commit() {
	var domainExit = getSessionSingleton('domainExit');

	pushCommand(commitCommand);
	var changes = popChanges();
	executeChanges(changes)
		.then(releaseDbClient)
		.then(domainExit.resolve, domainExit.rejectInActiveDomain);

	return domainExit.promise;
}

module.exports = commit;