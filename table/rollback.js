var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');
var newThrow = require('./newThrow');
var resultToPromise = require('./resultToPromise');
var getSessionSingleton = require('./getSessionSingleton');

function rollback(e) {
	var domainExit = getSessionSingleton('domainExit');

    var executeRollback = executeQuery.bind(null, rollbackCommand);
    var chain = resultToPromise()
        			.then(popChanges)
        			.then(executeRollback)
        			.then(releaseDbClient);
    if(e)
		newThrow(e, chain).then(null, domainExit.reject);
	else
    	chain.then(domainExit.resolve, domainExit.reject);
    return domainExit.promise;
}

module.exports = rollback;
