var getSessionSingleton = require('./getSessionSingleton');

function setSessionCache(id, value) {
	const cache = getSessionSingleton('cache');
	cache[id] = value;
}

module.exports = setSessionCache;