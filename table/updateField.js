var newUpdateCommand = require('./commands/newUpdateCommand');
var pushCommand = require('./commands/pushCommand');
var lastCommandMatches = require('./command/lastCommandMatches');

function updateField(table, column, row) {
	if (lastCommandMatches(row))
		return;
	var command = newUpdateCommand(table, column, row);
	pushCommand(command, row);
}

module.exports = updateField;