function newManyCache(joinRelation) {
    var c = {}
    var cache = {};
    var primaryColumns = joinRelation.childTable._primaryColumns;
    var keyLength = primaryColumns.length;

    c.tryGet = function(parentRow) {
        var key = toKey(parentRow);
        var index = 0;
        return tryGetCore(cache, index)

        function tryGetCore(cache, index) {
            var keyValue = key[index];
            if (keyLength == index) 
            	return cache.value;
            if (cache[index]) 
            	return tryGetCore(cache[index], ++index)
            //console.log(cache);
            return null;
        }

    };

    c.add = function(parentRow, result) {
        var key = toKey(parentRow);
        var index = 0;

        addCore(cache, index);

        function addCore(cache, index) {
            var keyValue = key[index];
            if (keyLength == index) {
                cache.value = result;
                return;
            }
            if (!cache.hasOwnProperty[index]) 
            	cache[index] = {};                        
            addCore(cache[index], ++index)
        }

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