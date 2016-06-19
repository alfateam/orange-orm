var getChangeSet = require('./getChangeSet');
var notifyDirty = require('../notifyDirty');
var negotiateEndEdit = require('./negotiateEndEdit');
var negotiateFlush = require('./negotiateFlush');

function pushCommand(command) {
	notifyDirty();
	var changes = getChangeSet();
	negotiateEndEdit(changes);
	changes.push(command);
	negotiateFlush();
}

module.exports = pushCommand;