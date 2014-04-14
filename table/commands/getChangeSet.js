var changeSetId = require('./changeSetId');

function getChangeSet() {
	return process.domain[changeSetId];
}

module.exports = getChangeSet;