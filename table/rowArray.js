var extractStrategy = require('./resultToRows/toDto/extractStrategy');
var newToDto = require('./resultToRows/toDto/newToDto');
var promise = require('./promise');
var empty = require('./nullPromise');

function newRowArray(table) {
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
        return toDto.apply(null,arguments).then(JSON.stringify);
    }

    function toDto(optionalStrategy) {
        var promise = empty;
        var result = [];
        var args = [].slice.call(arguments);
        args.push(table);
        var strategy = extractStrategy.apply(null, args);
        for (var i = 0; i < c.length; i++) {
            var map = mapSingleDto.bind(null,i);
            promise = promise.then(map);
        }

        function mapSingleDto(i) {
            var row = c[i];
            return newToDto(strategy, table)(row).then(function(dto) {
                result[i] = dto;
            });
        }
        return promise.then(function() {
            return result;
        });
    }


    return c;
}

module.exports = newRowArray;