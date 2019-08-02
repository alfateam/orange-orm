var tryGetFromCacheById = require('./tryGetFromCacheById');
var getFromDbById = require('./getFromDbById');
var resultToPromise = require('./resultToPromise');

function getById() {
	var cached =  tryGetFromCacheById.apply(null,arguments);
	if (cached)
		return resultToPromise(cached);
	return getFromDbById.apply(null,arguments);
}

getById.exclusive = getFromDbById.exclusive;

module.exports = getById;