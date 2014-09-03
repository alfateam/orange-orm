var when = require('a').when;
var c = {};

when(c)
    .it('should set expanded').assertEqual(true, c.sut.expanded)
    .it('should get relatives').assertDoesNotThrow(c.getRelatives.verify)
    .it('should return related row from cache').assertEqual(c.expected, c.returned)
