const getSessionSingleton = require('./getSessionSingleton');

function setSessionCache(context, id, value) {
	const cache = getSessionSingleton(context, 'cache');
	cache[id] = value;
}

module.exports = setSessionCache;