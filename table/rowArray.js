var extractStrategy = require('./resultToRows/toDto/extractStrategy');
var newToDto = require('./resultToRows/toDto/newToDto');
var promise = require('./promise');
var newEmpty = require('./resultToPromise');

function newRowArray(table) {
    var empty = newEmpty(null);
    var c = [];

    Object.defineProperty(c, "toJSON", {
        enumerable: false,
        value: toJSON
    });

    Object.defineProperty(c, "toDto", {
        enumerable: false,
        value: toDto
    });

    function toJSON(optionalStrategy) {
        var args = [].slice.call(arguments);
        args.push(table);
        var strategy = extractStrategy.apply(null, args);
        var promises = [];
        for (var i = 0; i < c.length; i++) {
            var row = c[i];
            var toDto = newToDto(strategy, table)(row);
            promises.push(toDto);
        };
        var all = promise.all(promises);
        return all.then(JSON.stringify);
    }

    function toDto(optionalStrategy) {
        var promise = empty;
        var args = [].slice.call(arguments);
        args.push(table);
        var strategy = extractStrategy.apply(null, args);
        var promises = [];
        for (var i = 0; i < c.length; i++) {
            var row = c[i];
            var toDto = newToDto(strategy, table).bind(null,row);
            
            promises.push(toDto);
        };
        return promise.all(promises);
    }

    return c;
};

module.exports = newRowArray;