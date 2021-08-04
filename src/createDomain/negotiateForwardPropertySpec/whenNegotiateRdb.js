var when = require('a').when;
var c = {};

when(c)
    .it('should not forward rdb').assertNotEqual(c.oldDomain.rdb, c.newDomain.rdb)