function cacheCore() {
    var c = {}
    var cache = {};
    var keyLength;


    c.tryGet = function(key) {
        var index = 0;
        var keyLength = key.length;

        return tryGetCore(cache, index)

        function tryGetCore(cache, index) {
            var keyValue = key[index];
            var cacheValue = cache[keyValue];
            if (typeof cacheValue === 'undefined')
                return null;
            if (keyLength - 1 == index)
                return cacheValue;
            return tryGetCore(cache[keyValue], ++index);
        }

    };

    c.add = function(key, result) {
        var index = 0;
        keyLength = key.length;

        addCore(cache, index);

        function addCore(cache, index) {
            var keyValue = key[index];
                
            if (keyLength - 1 == index) {
                cache[keyValue] = result;
                return;
            }
            if (!cache.hasOwnProperty[keyValue])
                cache[keyValue] = {};
            addCore(cache[keyValue], ++index)
        }

    };

    c.getAll = function() {
        var index = 0;
        var result = [];
        getAllCore(cache, index);

        function getAllCore(cache, index) {
            for (var name in cache) {
                var value = cache[name];
                if (index === keyLength - 1)
                    result.push(value);
                else
                    getAllCore(value, ++index);
            };
        };
        return result;
    };


    return c;
};

module.exports = cacheCore;