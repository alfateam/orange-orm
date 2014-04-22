var newChangeSet = require('./newChangeSet');
var beginCommand = require('./commands/beginCommand');
var pushCommand = require('./commands/pushCommand');

function begin() {
	newChangeSet();
	pushCommand(beginCommand);
}

module.exports = begin;