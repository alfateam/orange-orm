var getSessionSingleton = require('../getSessionSingleton');
function getChangeSet() {
	return getSessionSingleton('changes');
}

module.exports = getChangeSet;