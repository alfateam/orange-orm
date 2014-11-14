var setSessionSingleton = require('../setSessionSingleton');

function newInvalidateCache(key, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeChangedOnce(onChanged);
	cache = null;
	joinRelation = null;

	function onChanged(cache) {		
		setSessionSingleton(key);
	}
}

module.exports = newInvalidateCache;