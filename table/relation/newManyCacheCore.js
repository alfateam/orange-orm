var synchronizeAdded = require('./manyCache/synchronizeAdded');
var synchronizeChanged = require('./manyCache/synchronizeChanged');
var newCacheCore = require('../newCache');

function newManyCache(joinRelation) {
    var c = {}
    var cache = newCacheCore();
    synchronizeAdded(tryAdd, joinRelation);
    var primaryColumns = joinRelation.childTable._primaryColumns;

    c.tryGet = function(parentRow) {
        var key = toKey(parentRow);
        return cache.tryGet(key);
    };

    function tryAdd(parentRow, childRow) {
        var key = toKey(parentRow);
        var existing = cache.tryGet(key);
        if(existing)
            existing.push(childRow);
        else 
            existing = cache.tryAdd(key, [childRow]);
        synchronizeChanged(c.tryAdd, joinRelation, existing, childRow);         
    };

    c.tryAdd = tryAdd;

    function toKey(row) {
        return primaryColumns.map(onColumn);

        function onColumn(column) {
            return row[column.alias];
        }
    }

    return c;
};

module.exports = newManyCache;