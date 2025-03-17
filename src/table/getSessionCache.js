var getSessionSingleton = require('./getSessionSingleton');

function getSessionCache(id) {
	const cache = getSessionSingleton('cache');
	return cache[id];
}

module.exports = getSessionCache;