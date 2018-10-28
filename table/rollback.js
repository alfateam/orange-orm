var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges');
var newThrow = require('./newThrow');
var resultToPromise = require('./resultToPromise');

function rollback(e) {
    var executeRollback = executeQuery.bind(null, rollbackCommand);
    var chain = resultToPromise()
        			.then(popChanges)
        			.then(executeRollback)
        			.then(releaseDbClient)
        			.then(exitDomain);

     function exitDomain() {
     	if (process.domain)
     		process.domain.exit();
     }

    if (e)
        return newThrow(e, chain);
    return chain;
}

module.exports = rollback;
