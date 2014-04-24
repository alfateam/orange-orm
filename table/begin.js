var newChangeSet = require('./newChangeSet');
var beginCommand = require('./commands/beginCommand');
var executeQuery = require('./executeQueries/executeQuery');

function begin() {
	newChangeSet();
	return executeQuery(beginCommand);
}

module.exports = begin;