var when = require('a').when;
var c = {};

when(c)
    .it('should return result from db').assertEqual(c.result, c.returned)
    .it('should cache the result').assertDoesNotThrow(c.oneCache.add.verify);