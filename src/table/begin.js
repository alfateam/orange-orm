let beginCommand = require('./commands/beginCommand');
let executeQuery = require('./executeQueries/executeQuery');
let setSessionSingleton = require('./setSessionSingleton');

function begin() {
	setSessionSingleton('changes', []);
	return executeQuery(beginCommand());
}

module.exports = begin;