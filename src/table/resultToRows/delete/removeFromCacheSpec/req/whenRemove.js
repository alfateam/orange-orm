var when = require('a').when;
var c = {};

when(c)
    .it('should remove related children from cache').assertDoesNotThrow(c.nextRemoveFromCache.verify)
    .it('should remove row from cache').assertDoesNotThrow(c.cache.tryRemove.verify)
    
