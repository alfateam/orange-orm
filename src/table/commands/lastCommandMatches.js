var getChangeSet = require('./getChangeSet');

function lastCommandMatches(context, row) {
	var changeSet = getChangeSet(context);
	var lastIndex = changeSet.length-1;
	if (lastIndex >= 0 && changeSet[lastIndex].matches)
		return changeSet[lastIndex].matches(row);
	return false;
}

module.exports = lastCommandMatches;