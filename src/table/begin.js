let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');

function begin(context, options) {
	if (isTransactionLess(options)) {
		setSessionSingleton(context, 'transactionLess', true);
		return Promise.resolve();
	}
	return executeQuery(context, beginCommand(context));
}

function isTransactionLess(options) {
	return options === true || !!(options && options.transactionLess);
}

module.exports = begin;
