var when = require('a').when;
var c = {};

when(c)
    .it('should return another instance').assertNotEqual(c.sut, c.returned)
    .it('should return a copy with _exclusive set').assertDeepEqual(c.expected, c.returned)