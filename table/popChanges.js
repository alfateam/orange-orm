var changeSetId = require('./commands/changeSetId');

function popChanges() {
	var domain = process.domain;
	changeSet = domain[changeSetId];
	var length = changeSet.length;
	if (length > 0) {
		changeSet[length-1].endEdit();
		domain[changeSetId] = [];
	}
	return changeSet;

}

module.exports = popChanges;