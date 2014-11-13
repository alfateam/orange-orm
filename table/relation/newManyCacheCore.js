var newCacheCore = require('../newCache');
var newRowArray = require('../rowArray');

function newManyCache(joinRelation) {
    var c = {};
    var cache = newCacheCore();
    var primaryColumns = joinRelation.childTable._primaryColumns;

    c.tryGet = function(parentRow) {
        var key = toKey(parentRow);
        var rows =  cache.tryGet(key);
        if (!rows) 
            return newArray();
        return rows;
    };

    function tryAdd(parentRow, childRow) {
        var key = toKey(parentRow);
        var existing = cache.tryGet(key);
        if(existing) {
            existing.push(childRow);
            return;
        }
        var rows = newArray();
        rows.push(childRow);
        existing = cache.tryAdd(key, rows);
    }

    function newArray() {
        return newRowArray(joinRelation.parentTable);
    }

    c.tryAdd = tryAdd;

    c.tryRemove = function(parentRow, childRow) {
        var key = toKey(parentRow);
        var existing = cache.tryGet(key);
        var index = existing.indexOf(childRow);
        existing.splice(index,1);
    };

    function toKey(row) {
        return primaryColumns.map(onColumn);

        function onColumn(column) {
            return row[column.alias];
        }
    }

    return c;
}

module.exports = newManyCache;