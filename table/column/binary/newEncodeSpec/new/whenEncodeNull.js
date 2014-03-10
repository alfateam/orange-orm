var when = require('a').when;
var c = {};

when(c)
.it('should return null as string').assertStrictEqual(c.expected, c.returned);