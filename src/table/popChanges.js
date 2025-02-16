var getChangeSet = require('./commands/getChangeSet');
var compressChanges = require('./commands/compressChanges');

function popChanges(context) {
	var changeSet = getChangeSet(context);
	var length = changeSet.length;
	if (length > 0) {
		var lastCmd = changeSet[length-1];
		if (lastCmd.endEdit)
			lastCmd.endEdit();
		var compressed = compressChanges(context, changeSet);
		changeSet.length = 0;
		return compressed;
	}
	return changeSet;

}

module.exports = popChanges;