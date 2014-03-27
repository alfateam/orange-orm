var newCacheCore = require('./newManyCacheCore');
var newInvalidateCache = require('./newInvalidateCache');
var newId = require('../../newId');

function newManyCache(joinRelation) {
    var c = {}
    var key = newId();

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