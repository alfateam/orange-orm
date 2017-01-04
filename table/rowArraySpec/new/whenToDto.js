var when = require('a').when;
var c = {};

when(c)
    .it('should negotiate next tick').assertDoesNotThrow(c.negotiateNextTick.verify)
    .it('should map dtos').assertDeepEqual(c.expected, c.returned)
