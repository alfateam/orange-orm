var getChangeSet = require('./getChangeSet');
var negotiateEndEdit = require('./negotiateEndEdit');

function pushCommand(command) {
	var changes = getChangeSet();
	negotiateEndEdit(changes);
	changes.push(command);
}

module.exports = pushCommand;