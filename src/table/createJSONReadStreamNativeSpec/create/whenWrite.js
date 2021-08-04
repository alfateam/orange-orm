var when = require('a').when;
var c = {};

when(c)
    .it('should push JSON to stream array').assertDoesNotThrow(c.transformer.push.verify)
    .it('should invoke callbacks').assertDoesNotThrow(c.cb.verify)
