var newCacheCore = require('./newManyCacheCore');
var newInvalidateCache = require('./newInvalidateCache');
var newKey = require('../../newObject');

function newManyCache(joinRelation) {
    var c = {}
    var key = newKey();

    c.tryGet = function(parentRow) {
        var cache = process.domain[key];
        if (!cache) {
            cache = newCacheCore(joinRelation);
            process.domain[key] = cache; 
            newInvalidateCache(key, joinRelation);
        }
        return cache.tryGet(parentRow);
    };
    return c;
}

module.exports = newManyCache;