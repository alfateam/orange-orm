var when = require('a').when;
var c = {};

when(c)
    .it('should return rows').assertDeepEqual(c.expected, c.returned)
    ;