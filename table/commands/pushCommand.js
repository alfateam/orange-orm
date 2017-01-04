var getChangeSet = require('./getChangeSet');
var notifyDirty = require('../notifyDirty');
var negotiateEndEdit = require('./negotiateEndEdit');

function pushCommand(command) {
	notifyDirty();
	var changes = getChangeSet();
	negotiateEndEdit(changes);
	changes.push(command);
}

module.exports = pushCommand;