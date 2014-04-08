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

    c.tryAdd = function(key, result) {
        var index = 0;
        keyLength = key.length;
        
        return  addCore(cache, index);
        
        function addCore(cache, index) {
            var keyValue = key[index];
                
            if (keyLength - 1 == index) {
                if (keyValue in cache)
                    return cache[keyValue];
                
                cache[keyValue] = result;
                return result;
            }
            if (! (keyValue in cache))
                cache[keyValue] = {};            
            return addCore(cache[keyValue], ++index)
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


    c.subscribeAdded = function(onAdded) {
//todo
    };

    c.subscribeRemoved = function(onRemoved) {
//todo
    };

    c.tearDown = function() {
//todo
    };


    return c;
};

module.exports = cacheCore;