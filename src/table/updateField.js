var newUpdateCommand = require('./commands/newUpdateCommand');
var pushCommand = require('./commands/pushCommand');
var lastCommandMatches = require('./commands/lastCommandMatches');

function updateField(context, table, column, row) {
	if (lastCommandMatches(context, row))
		return;
	var command = newUpdateCommand(context, table, column, row);
	pushCommand(context, command);
}

module.exports = updateField;