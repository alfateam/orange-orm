var when = require('a').when;
var c = {};

when(c)
    .it('should set alias').assertEqual(c.alias, c.sut.alias)
    .it('should set innerJoin').assertEqual(c.innerJoin, c.sut.innerJoin)
    .it('should set filter').assertEqual(c.filter, c.sut.filter)
