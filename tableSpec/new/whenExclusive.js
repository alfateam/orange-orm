var when = require('a').when;
var c = {};

when(c)
    .it('should return another instance').assertNotEqual(c.sut, c.returned)
    .it('should return a clone').assertDeepEqual(c.sut, c.returned)
    .it('should should set _exclusive on copy').assertStrictEqual(true, c.returned._exclusive)
