var newUpdateCommand = require('./commands/newUpdateCommand');
var pushCommand = require('./commands/pushCommand');

function updateField(table, column, row) {
	var command = newUpdateCommand(table, column, row);
	pushCommand(command, row);
}

module.exports = updateField;