var setSessionSingleton = require('./setSessionSingleton');

function clearCache(context) {
	setSessionSingleton(context, 'cache', {});
}

module.exports = clearCache;