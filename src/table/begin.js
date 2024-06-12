let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');

function begin(readonly) {
	setSessionSingleton('changes', []);
	if (readonly) {
		setSessionSingleton('readonly', true);
		return Promise.resolve();
	}
	return executeQuery(beginCommand());
}

module.exports = begin;