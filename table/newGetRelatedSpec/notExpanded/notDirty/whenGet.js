var when = require('a').when;
var c = {};

when(c)
    .it('should get relatives').assertDoesNotThrow(c.getRelatives.verify)
    .it('should return related row from cache').assertEqual(c.expected, c.returned)
