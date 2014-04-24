var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges'); 

function rollback(e) {
	console.log(e);
	popChanges();
	return executeQuery(rollbackCommand).then(releaseDbClient);	
}

module.exports = rollback;