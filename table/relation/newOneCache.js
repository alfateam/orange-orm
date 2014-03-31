var newManyCache = require('./newManyCache');

function newOneCache(joinRelation) {
	var c = {};
	var cache = newManyCache(joinRelation);

	c.tryGet = function(parent) {
		var res = cache.tryGet(parent);
		if (res)
			return res[0];
		return null;
	};
	return c;
}

module.exports = newOneCache;
