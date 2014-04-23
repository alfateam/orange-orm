var rollbackCommand = require('./commands/rollbackCommand');
var executeQuery = require('./executeQueries/executeQuery');
var releaseDbClient = require('./releaseDbClient');
var popChanges = require('./popChanges'); 

function rollback(e) {
	popChanges();
	return executeQuery(rollbackCommand).then(releaseDbClient).then(_throw);
	
	function _throw() {
		throw e;
	}
}

module.exports = rollback;