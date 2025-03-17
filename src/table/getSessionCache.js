const getSessionSingleton = require('./getSessionSingleton');

function getSessionCache(context, id) {
	const cache = getSessionSingleton(context, 'cache');
	return cache[id];
}

module.exports = getSessionCache;