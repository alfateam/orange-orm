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
            fillCache(cache);
            process.domain[key] = cache;
            newInvalidateCache(key, joinRelation);
        }
        return cache.tryGet(parentRow);
    };

    function fillCache(cache) {
        var childTable = joinRelation.childTable;
        var primaryColumns = childTable._primaryColumns;
        var childCache = childTable._cache;
        var children = childCache.getAll();
        children.forEach(addToCache);

        function addToCache(child) {
            var parent = {};

            joinRelation.columns.forEach(addKeyToParent);

            function addKeyToParent(childPk, index) {
                var primaryColumn = primaryColumns[index];
                parent[primaryColumn.alias] = child[childPk.alias];
            }            
            cache.tryAdd(parent, child);
        }
    }

    return c;
}

module.exports = newManyCache;