var tryGetFromCacheById = require('./tryGetFromCacheById');
var tryGetFromDbById = require('./tryGetFromDbById');
var resultToPromise = require('./resultToPromise');

function get() {
	var cached =  tryGetFromCacheById.apply(null,arguments);
	if (cached)
		return resultToPromise(cached);
	return tryGetFromDbById.apply(null,arguments);
}
get.exclusive = tryGetFromDbById.exclusive;

module.exports = get;