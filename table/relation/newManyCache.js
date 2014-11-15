var synchronizeChanged = require('./manyCache/synchronizeChanged');
var synchronizeAdded = require('./manyCache/synchronizeAdded');
var synchronizeRemoved = require('./manyCache/synchronizeRemoved');
var extractParentKey = require('./manyCache/extractParentKey');
var newCacheCore = require('./newManyCacheCore');
var newId = require('../../newId');
var getSessionSingleton = require('../getSessionSingleton');
var setSessionSingleton = require('../setSessionSingleton');

function newManyCache(joinRelation) {
    var c = {};
    var key = newId();

    c.tryAdd = function(parent, child) {
        var cache = getSessionSingleton(key);
        cache.tryAdd(parent, child);
        synchronizeChanged(c, joinRelation, parent, child);
    };

    c.tryRemove = function(parent, child) {
        var cache = getSessionSingleton(key);
        cache.tryRemove(parent, child);
    };

    c.tryGet = function(parentRow) {
        var cache = getSessionSingleton(key);
        if (!cache) {
            cache = newCacheCore(joinRelation);
            setSessionSingleton(key, cache);
            fillCache(cache);
            synchronizeAdded(c.tryAdd, joinRelation);
            synchronizeRemoved(c.tryRemove, joinRelation);
        }
        return cache.tryGet(parentRow);
    };


    function fillCache(cache) {
        var childTable = joinRelation.parentTable;
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