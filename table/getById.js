 var tryGetFromCacheById = require('./tryGetFromCacheById');
 var getFromDbById = require('./getFromDbById');
 var resultToPromise = require('./resultToPromise');

function get() {
	var cached =  tryGetFromCacheById.apply(null,arguments)
	if (cached)
		return resultToPromise(cached);
	return getFromDbById.apply(null,arguments);
}

module.exports = get;