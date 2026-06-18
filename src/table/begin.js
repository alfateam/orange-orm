let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');
let tryGetSessionContext = require('./tryGetSessionContext');

function begin(context, options) {
	if (options && options.suppressSyncOutbox)
		setSessionSingleton(context, 'suppressSyncOutbox', true);
	if (isTransactionLess(context, options)) {
		setSessionSingleton(context, 'transactionLess', true);
		return Promise.resolve();
	}
	return executeQuery(context, beginCommand(context));
}

function isTransactionLess(context, options) {
	if (options === true || !!(options && options.transactionLess))
		return true;
	const rdb = tryGetSessionContext(context);
	return !!(options && options.readonly && rdb && rdb.engine === 'sqlite');
}

module.exports = begin;
