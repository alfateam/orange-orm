var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');

function rollback() {
	return executeQuery(rollbackCommand);	
}

module.exports = rollback;