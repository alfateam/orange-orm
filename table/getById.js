 var tryGetFromCacheById = require('./tryGetFromCacheById');
 var getFromDbById = require('./getFromDbById');

function get() {
	var cached =  tryGetFromCacheById.apply(null,arguments)
	if (cached)
		return cached;
	return getFromDbById.apply(null,arguments);
}

module.exports = get;