var changeSetId = require('./commands/changeSetId');

function newChangeSet() {
	process.domain[changeSetId] = [];
}

module.exports = newChangeSet;