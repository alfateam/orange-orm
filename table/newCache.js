var newEmitEvent = require('../emitEvent');

function cacheCore() {
    var emitAdded = newEmitEvent();
    var emitRemoved = newEmitEvent();
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
                emitAdded(result);
                return result;
            }
            if (! (keyValue in cache))
                cache[keyValue] = {};            
            return addCore(cache[keyValue], ++index)
        }
    };

    c.tryRemove = function(key) { 
        var index = 0;
        var keyLength = key.length;

        return tryRemoveCore(cache, index)

        function tryRemoveCore(cache, index) {
            var keyValue = key[index];
            if (!(keyValue in cache))
                return null;
            var cacheValue = cache[keyValue];
            if (keyLength - 1 == index) {
                delete cache[keyValue];
                emitRemoved(cacheValue);
                return cacheValue;
            }
                
            return tryRemoveCore(cache[keyValue], ++index);
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
                    getAllCore(value, index+1);
            };
        };
        return result;
    };

    c.subscribeAdded = emitAdded.add;
    c.subscribeRemoved = emitRemoved.add;

    return c;
};

module.exports = cacheCore;