var newCacheCore = require('./newManyCacheCore');

function newManyCache(joinRelation) {
    var c = {}
    var cache;

    c.tryGet = function(parentRow) {
        if (!cache) {
            cache = newCacheCore(joinRelation);
            //newCacheInvalidator(...);
        }
        return cache.tryGet(parentRow);
    };

    return c;
};

/*function() newCacheInvalidator(context, tableCache) {
    tableCache.subscribeChangedOnce(onChanged);
    tableCache = null;    
    function onChanged(cache) {
        context.cache = null;        
    }
    
}*/

module.exports = newManyCache;