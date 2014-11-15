var beginCommand = require('./commands/beginCommand');
var executeQuery = require('./executeQueries/executeQuery');
var setSessionSingleton = require('./setSessionSingleton');

function begin() {
	setSessionSingleton('changes', []);
	return executeQuery(beginCommand);
}

module.exports = begin;