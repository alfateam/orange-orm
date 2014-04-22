var newUpdateCommand = require('./commands/newUpdateCommand');
var pushCommand = require('./commands/pushCommand');
var lastCommandMatches = require('./commands/lastCommandMatches');

function updateField(table, column, row) {
	if (lastCommandMatches(row))
		return;
	var command = newUpdateCommand(table, column, row);
	pushCommand(command);
}

module.exports = updateField;