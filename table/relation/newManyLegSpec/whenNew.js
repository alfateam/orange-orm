var when = require('a').when;
var c = {};

when(c)
    .it('should return leg').assertEqual(c.leg, c.sut)
    .it('should set expand method').assertEqual(c.relation.expand, c.sut.expand);