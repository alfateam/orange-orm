var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');
var releaseDbClient = require('./releaseDbClient');

function rollback() {
	return executeQuery(rollbackCommand).then(releaseDbClient);
}

module.exports = rollback;