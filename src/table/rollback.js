const rollbackCommand = require('./commands/rollbackCommand');
const executeQuery = require('./executeQueries/executeQuery');
const releaseDbClient = require('./releaseDbClient');
const popChanges = require('./popChanges');
const newThrow = require('./newThrow');
const resultToPromise = require('./resultToPromise');
const conflictId = '12345678-1234-1234-1234-123456789012';
const getSessionSingleton = require('./getSessionSingleton');

function _rollback(context, e) {
	let hookError;
	var chain = resultToPromise()
		.then(() => popChanges(context))
		.then(executeRollback)
		.then(callAfterRollback)
		.then(() => releaseDbClient(context))
		.then(throwHookErrorIfAny);


	function executeRollback() {
		const transactionLess =  getSessionSingleton(context, 'transactionLess');
		if (transactionLess)
			return Promise.resolve();
		return executeQuery(context, rollbackCommand);
	}

	function callAfterRollback() {
		const hook = getSessionSingleton(context, 'afterRollbackHook');
		if (!hook)
			return Promise.resolve();
		return Promise.resolve()
			.then(() => hook(e))
			.catch((err) => {
				hookError = err;
			});
	}

	function throwHookErrorIfAny(res) {
		if (hookError)
			throw hookError;
		return res;
	}

	if (e) {
		if (e.message?.indexOf('ORA-01476: divisor is equal to zero') > -1)
			return newThrow(context, new Error('Conflict when updating a column'), chain);
		let errors = e.message && e.message.split(conflictId) || [];
		if (errors.length > 1) {
			return newThrow(context, new Error(errors[1]), chain);
		}
		else
			return newThrow(context, e, chain);
	}
	return chain;
}

function rollback(context, e) {
	return Promise.resolve().then(() => _rollback(context, e));
}

module.exports = rollback;
