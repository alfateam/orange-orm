let newManyCache = require('./newManyCache');

function newOneCache(joinRelation) {
	let c = {};
	let cache = newManyCache(joinRelation);

	c.tryGet = function(context, parent) {
		let res = cache.tryGet(context, parent);
		if (res.length === 0)
			return null;
		return res[0];
	};

	c.getInnerCache = function(context) {
		let _cache = cache.getInnerCache(context);
		let _c = {};
		_c.tryGet = function(context, parent) {
			let res = _cache.tryGet(context, parent);
			if (res.length === 0)
				return null;
			return res[0];
		};
		return _c;
	};
	return c;
}

module.exports = newOneCache;
