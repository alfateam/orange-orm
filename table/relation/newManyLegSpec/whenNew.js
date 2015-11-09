var when = require('a').when;
var c = {};

when(c)
    .it('should return leg').assertEqual(c.leg, c.sut)
    .it('should set name').assertEqual(c.joinRelation.rightAlias, c.sut.name)
    