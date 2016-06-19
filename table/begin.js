var beginCommand = require('./commands/beginCommand');
var executeQuery = require('./executeQueries/executeQuery');
var setSessionSingleton = require('./setSessionSingleton');

function begin() {
	var changeSet = [];
	changeSet.batchSize = 1;
	changeSet.queryCount = 0;
	changeSet.prevQueryCount = -1;
	setSessionSingleton('changes', changeSet);
	return executeQuery(beginCommand);
}

module.exports = begin;