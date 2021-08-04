var newUpdateCommand = require('./commands/newUpdateCommand');
var pushCommand = require('./commands/pushCommand');
var lastCommandMatches = require('./commands/lastCommandMatches');

function updateField(table, column, row, oldValue) {
	if (lastCommandMatches(row))
		return;
	var command = newUpdateCommand(table, column, row, oldValue);
	pushCommand(command);
}

module.exports = updateField;