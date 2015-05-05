var extractStrategy = require('./resultToRows/toDto/extractStrategy');
var resultToPromise = require('./resultToPromise')
var newArray = require('../newArray');

function newRowArray(table) {
    var c = [];

    Object.defineProperty(c, "toJSON", {
        enumerable: false,
        value: toJSON
    });

    Object.defineProperty(c, "toDto", {
        enumerable: false,
        writable: true,
        value: toDto
    });

    function toJSON(optionalStrategy) {
        return c.toDto.apply(null, arguments).then(JSON.stringify);
    }

    function toDto(optionalStrategy) {
        var args = arguments;
        var result = newArray();
        var promise = resultToPromise(result);

        var length = c.length;
        for (var i = 0; i < length; i++) {
            toDtoAtIndex(i);
        };

        function toDtoAtIndex(i) {
            var row = c[i];
            promise = promise.then(getDto).then(onDto);

            function getDto() {
                return row.toDto.apply(row,args);
            }            

            function onDto(dto) {
                result.push(dto);
            }
        }

        return promise.then(function() {
            return result;
        })
    }

    return c;
}

module.exports = newRowArray;
