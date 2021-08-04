var when = require('a').when;
var c = {};

when(c)
    .it('should return emptyPromise').assertEqual(c.emptyPromise, c.returned)
    .it('should push deleteCommands').assertDoesNotThrow(c.pushCommand.verify)
    
