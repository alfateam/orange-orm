var getChangeSet = require('./getChangeSet');
var notifyDirty = require('../notifyDirty');

function pushCommand(command) {
	notifyDirty();
	var changes = getChangeSet();
	changes.push(command);
}

module.exports = pushCommand;