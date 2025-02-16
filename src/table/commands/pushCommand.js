var getChangeSet = require('./getChangeSet');
var negotiateEndEdit = require('./negotiateEndEdit');

function pushCommand(context, command) {
	var changes = getChangeSet(context);
	negotiateEndEdit(changes);
	changes.push(command);
}

module.exports = pushCommand;