var when = require('a').when;
var c = {};

when(c)
    .it('should return leg').assertEqual(c.leg, c.sut)
    ;