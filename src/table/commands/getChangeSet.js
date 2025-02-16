var getSessionSingleton = require('../getSessionSingleton');
function getChangeSet(context) {
	return getSessionSingleton(context, 'changes');
}

module.exports = getChangeSet;