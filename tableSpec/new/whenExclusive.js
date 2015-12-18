var when = require('a').when;
var c = {};

when(c)    
    .it('should return table').assertStrictEqual(c.sut, c.returned)
    .it('should set _exclusive').assertEqual(true, c.sut._exclusive)