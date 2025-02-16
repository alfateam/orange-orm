let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');

function begin(context, transactionLess) {
	setSessionSingleton(context, 'changes', []);
	if (transactionLess) {
		setSessionSingleton(context, 'transactionLess', true);
		return Promise.resolve();
	}
	return executeQuery(context, beginCommand(context));
}

module.exports = begin;