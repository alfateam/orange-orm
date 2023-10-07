const rollbackCommand = require('./commands/rollbackCommand');
const executeQuery = require('./executeQueries/executeQuery');
const releaseDbClient = require('./releaseDbClient');
const popChanges = require('./popChanges');
const newThrow = require('./newThrow');
const resultToPromise = require('./resultToPromise');
const conflictId = '12345678-1234-1234-1234-123456789012';

function rollback(e) {
	var executeRollback = executeQuery.bind(null, rollbackCommand);
	var chain = resultToPromise()
		.then(popChanges)
		.then(executeRollback)
		.then(releaseDbClient);

	if (e) {
		let errors = e.message && e.message.split(conflictId) || [];
		if (errors.length > 1) {
			return newThrow(new Error(errors[1]), chain);
		}
		else
			return newThrow(e, chain);
	}
	return chain;
}

module.exports = function(e) {
	return Promise.resolve().then(() => rollback(e));
};