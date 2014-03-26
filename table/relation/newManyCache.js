var newCacheCore = require('./newCacheCore');

function newManyCache(joinRelation) {
    var c = {}
    var cache = newCacheCore();
    var primaryColumns = joinRelation.childTable._primaryColumns;

    c.tryGet = function(parentRow) {
        var key = toKey(parentRow);
        return cache.tryGet(key);
    };

    c.add = function(parentRow, result) {
        var key = toKey(parentRow);
        cache.add(key, result);
    };

    function toKey(row) {
        return primaryColumns.map(onColumn);

        function onColumn(column) {
            return row[column.alias];
        }
    }

    return c;
};

module.exports = newManyCache;