function cacheCore() {
    var c = {}
    var cache = {};


    c.tryGet = function(key) {
        var index = 0;
        var keyLength = key.length;

        return tryGetCore(cache, index)

        function tryGetCore(cache, index) {
            var keyValue = key[index];
            var cacheValue = cache[keyValue];
            if (typeof cacheValue === 'undefined')
                return null;
            if (keyLength == index)
                return cacheValue;
            return tryGetCore(cache[keyValue], ++index);
        }

    };

    c.add = function(key, result) {

        var index = 0;
        var keyLength = key.length;

        addCore(cache, index);

        function addCore(cache, index) {
            var keyValue = key[index];
            if (keyLength == index) {
                cache[keyValue] = result;
                return;
            }
            if (!cache.hasOwnProperty[keyValue])
                cache[keyValue] = {};
            addCore(cache[keyValue], ++index)
        }

    };


    return c;
};

module.exports = cacheCore;