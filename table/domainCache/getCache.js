var newCache = require('../newCache');
var getSessionSingleton = require('../getSessionSingleton');
var setSessionSingleton = require('../setSessionSingleton');

function getCache(id) {
	var cache = getSessionSingleton(id);
	if (cache)
		return cache;
	cache = newCache();
	setSessionSingleton(id, cache);
	return cache;
}



module.exports = getCache;