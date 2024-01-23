const rollbackCommand = require('./commands/rollbackCommand');
const executeQuery = require('./executeQueries/executeQuery');
const releaseDbClient = require('./releaseDbClient');
const popChanges = require('./popChanges');
const newThrow = require('./newThrow');
const resultToPromise = require('./resultToPromise');
const { escape } = require('mysql2');
const conflictId = '12345678-1234-1234-1234-123456789012';

function rollback(e) {
	var executeRollback = executeQuery.bind(null, rollbackCommand);
	var chain = resultToPromise()
		.then(popChanges)
		.then(executeRollback)
		.then(releaseDbClient);

	if (e) {
		if (e.message.indexOf('ORA-01476: divisor is equal to zero') > -1)
			return newThrow(new Error('Conflict when updating a column'), chain);
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