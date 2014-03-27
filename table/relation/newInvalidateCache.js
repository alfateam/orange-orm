function newInvalidateCache(key, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeChangedOnce(onChanged);
	cache = null;
	joinRelation = null;

	function onChanged(cache) {		
		delete process.domain[key];
	}
}

module.exports = newInvalidateCache;