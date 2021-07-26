let newManyCache = require('./newManyCache');

function newOneCache(joinRelation) {
	let c = {};
	let cache = newManyCache(joinRelation);

	c.tryGet = function(parent) {
		let res = cache.tryGet(parent);
		if (res.length === 0)
			return null;
		return res[0];
	};

	c.getInnerCache = function() {
		let _cache = cache.getInnerCache();
		let _c = {};
		_c.tryGet = function(parent) {
			let res = _cache.tryGet(parent);
			if (res.length === 0)
				return null;
			return res[0];
		};
		return _c;
	};
	return c;
}

module.exports = newOneCache;
