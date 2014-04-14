var getChangeSet = require('./getChangeSet');

function pushCommand(command) {
	var changes = getChangeSet();
	changes.push(command);
}

module.exports = pushCommand;