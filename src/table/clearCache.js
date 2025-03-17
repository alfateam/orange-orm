var setSessionSingleton = require('./setSessionSingleton');

function clearCache() {
	setSessionSingleton('cache', {});
}

module.exports = clearCache;