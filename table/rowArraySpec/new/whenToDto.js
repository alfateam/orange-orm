var when = require('a').when;
var c = {};

when(c)
    .it('should map dtos').assertDeepEqual(c.expected, c.returned)
