var when = require('a').when;
var c = {};

when(c)
    .it('should forward to queryContext').assertDoesNotThrow(c.queryContext.dirty.verify)
