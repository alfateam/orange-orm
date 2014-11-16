var when = require('a').when;
var c = {};

when(c)
    .it('should not try to release client').assertEqual(undefined, c.didThrow)
    .it('should delete session context').assertDoesNotThrow(c.deleteSessionContext.verify)
