var when = require('a').when;
var c = {};

when(c)
    .it('should remove from cache').assertDoesNotThrow(c.removeFromCache.verify)
    .it('should push deleteCommands').assertDoesNotThrow(c.pushCommand.verify)
    
