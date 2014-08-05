var when = require('a').when;
var c = {};

when(c)
    .it('should remove rows in array').assertDoesNotThrow(c.nextRemoveFromCache.verify)
    
