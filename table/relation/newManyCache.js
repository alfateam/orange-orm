var synchronizeChanged = require('./manyCache/synchronizeChanged');
var synchronizeAdded = require('./manyCache/synchronizeAdded');
var synchronizeRemoved = require('./manyCache/synchronizeRemoved');
var extractParentKey = require('./manyCache/extractParentKey');
var newCacheCore = require('./newManyCacheCore');
var newId = require('../../newId');

function newManyCache(joinRelation) {
    var c = {}
    var key = newId();

    c.tryAdd = function(parent, child) {
        var cache = process.domain[key];
        cache.tryAdd(parent, child);
        synchronizeChanged(c, joinRelation, parent, child);
    };

    c.tryRemove = function(parent, child) {
        var cache = process.domain[key];
        cache.tryRemove(parent, child);
    };

    c.tryGet = function(parentRow) {
        var cache = process.domain[key];
        if (!cache) {
            cache = newCacheCore(joinRelation);
            fillCache(cache);
            process.domain[key] = cache;
            synchronizeAdded(c.tryAdd, joinRelation);
            synchronizeRemoved(c.tryRemove, joinRelation);
        }
        return cache.tryGet(parentRow);
    };


    function fillCache(cache) {
        var childTable = joinRelation.childTable;
        var childCache = childTable._cache;
        var children = childCache.getAll();
        children.forEach(addToCache);

        function addToCache(child) {
            var parent = extractParentKey(joinRelation, child);  
            c.tryAdd(parent, child);
        }
    }

    

    return c;
}

module.exports = newManyCache;