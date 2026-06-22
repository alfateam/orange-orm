let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');

function begin(context, options) {
	if (options && options.suppressSyncOutbox)
		setSessionSingleton(context, 'suppressSyncOutbox', true);
	if (isTransactionLess(options)) {
		setSessionSingleton(context, 'transactionLess', true);
		return Promise.resolve();
	}
	return executeQuery(context, beginCommand(context));
}

function isTransactionLess(options) {
	if (options && options.transactionLess)
		return true;
	if (options && options.readonly)
		return true;
	return false;
}

module.exports = begin;
